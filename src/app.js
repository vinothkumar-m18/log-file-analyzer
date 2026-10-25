import {readFile, stat} from 'node:fs/promises';
import path from 'path';

const LOG_LEVELS = ['INFO', 'WARN', 'ERROR', 'DEBUG', 'FATAL'];
const readLogFile = async (filePath)=>{
    if(!filePath || typeof filePath !== 'string'){
        throw new Error('A valid file path string is required');
    }
    const resolved = path.resolve(filePath);
    const ext = path.extname(resolved);
    if(ext !== '.log'){
        throw new Error(`Invalid file extension "${ext}". Expected ".log"`);
    }    
    const stats = await stat(resolved);
    if(!stats.isFile()){
        throw new Error(`Path is not a regular file: ${resolved}`);
    }
    const MAX_SIZE = 10 * 1024 * 1024;
    if(stats.size > MAX_SIZE){
        throw new Error(`File is too large (${(stats.size / 1024 / 1024).toFixed(1)}MB). Max allowed: ${MAX_SIZE / 1024 / 1024} MB`);
    }
    const data = await readFile(resolved, 'utf8');
    if(data.trim().length === 0){
        console.log('File is empty');
        return;
    }
    console.log(data);
    const lines = data.split('\n').filter(line => (line.trim() !== ''));
    const counts = {};
    for(const level of LOG_LEVELS){
        counts[level] = 0;
    }
    for(const line of lines){
        const match = line.match(/\b(INFO|WARN|ERROR|DEBUG|FATAL)\b/);
        if(match){
            counts[match[1]]++;
        }
    }
    for(const [level, count] of Object.entries(counts)){
        if(count > 0){
            console.log(`${level}: ${count}`);
        }
    }
    console.log('-------------------------');
    const levelPattern = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} ERROR\b/;
    const errorLines = lines.filter(line => (levelPattern.test(line)));
    errorLines.forEach((line, i) => {
        console.log(`${i+1}. ${line}`);
    })
    console.log(`Total error lines: ${errorLines.length}`);
    const expected = [
        'ERROR Database connection failed',
        'ERROR Request timed out'
    ];
    console.log('verification');
    expected.forEach(msg =>{
        const count = errorLines.filter(line => line.includes(msg)).length;
        const status = count === 1 ? 'PASS' : 'FAIL';
        console.log(`${status} | ${msg} -> found${count} time's`);
    })

};
const filePath = 'sample.log';
readLogFile(filePath).catch((err)=>{
    // const messages = {
    //     ENOENT: `File not found: ${filePath}`,
    //     EACCES: `Permission denied: ${filePath}`,
    //     EISDIR: `Path is a directory, not a file: ${filePath}`,
    //     EMFILE: `Too many open file descriptors.`,
    //     ENOSPC: `No space left on device`,
    // };
    // const msg = messages[err.code] ?? err.message;
    console.error(`${err.message}`);
    process.exitCode(1);
});
