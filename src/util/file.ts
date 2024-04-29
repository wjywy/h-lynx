import * as fs from 'fs/promises';
import * as path from 'path';

// 给出你要查询的文件后缀，输出Tsx文件同级目录下包含此后缀的文件路径 （一级文件夹）
export const getSymbolFilePath = async(moudleFilePaths: string[], symbol: string = '.less') => {
    const paths: string[] = [];
    for (const dir of moudleFilePaths) {
        const files = await fs.readdir(dir);
        for (const file of files) {
            const filePath = path.join(dir, file); // 构建文件的完整路径
            const stats = await fs.stat(filePath); // 获取文件的信息
            if (stats.isFile()) {
                if (path.extname(filePath) === symbol) {
                    paths.push(filePath);
                }
            } else if (stats.isDirectory()) {
                break;
            }
        }
    }
    return paths;
}