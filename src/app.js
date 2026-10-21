import {readFile, stat} from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'path';

const readLogFile = async (filePath)=>{
    if(!filePath || typeof filePath !== 'string'){
        throw new Error('A valid file path string is required');
    }
    const resolved = path.resolve(filePath);
    const ext = path.extname(resolved);
    if(ext !== '.log'){
        throw new Error(`Invalid file extension "${ext}". Expected ".log"`);
    }

    if(!existsSync(resolved)){
        throw new Error(`File not found: ${resolved}`);
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