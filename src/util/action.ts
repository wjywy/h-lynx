import { dependencies } from '../constant/dependencies';

// 根据传入的旧节点返回新节点,若不存在旧节点则返回null
export const lodToNew = (old: string) => {
    for (const data of dependencies) {
        console.log(old, data.old, 'newOld>>>');
        if (data.old === old) {
            return data.new
        }
    }

    return null
}