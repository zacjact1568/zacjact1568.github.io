/**
 * 是否为开发环境
 */
export const debug = process.env.NODE_ENV == "development";

/**
 * 是否为生产环境
 * 编译的时候该值为 true
 */
export const production = process.env.NODE_ENV == "production";
