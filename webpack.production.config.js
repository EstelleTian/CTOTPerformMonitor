/*
 * @file webpack配置文件(生产环境)
 * @author liutianjiao
 * @date 2017-12-28
 */
const path = require('path');
const webpack = require('webpack');
//配置压缩js
const uglifyJsPlugin = webpack.optimize.UglifyJsPlugin;
const HtmlWebpackPlugin = require('html-webpack-plugin');
module.exports = {
    entry: './app/js/index.js',  //入口
    output: {
        path: path.join(__dirname, '/build'),
        filename: '[name].[hash:5].js',
    },
    resolve: {
        extensions: ['.js'],
    },
    module: {
        rules: [
            {
                test: /\.(js)$/,
                use: 'babel-loader',
            },
            {
                test: /\.css$/,
                use: [
                    'style-loader',
                    'css-loader?#sourceMap',
                ],
            },
            {
                test: /\.eot|woff|eot|ttf|svg$/,
                use: ['file-loader']
            },
            {
                test: /\.(png|jpg)$/,
                use: 'url-loader?limit=1048576',
            },
        ]
    },
    plugins: [
        new uglifyJsPlugin({
            // 最紧凑的输出
            beautify: false,
            // 删除所有的注释
            comments: false,
            compress: {
              // 在UglifyJs删除没有用到的代码时不输出警告
              warnings: false,
              // 删除所有的 `console` 语句
              // 还可以兼容ie浏览器
              drop_console: true,
              // 内嵌定义了但是只用到一次的变量
              collapse_vars: true,
              // 提取出出现多次但是没有定义成变量去引用的静态值
              reduce_vars: true,
            }
        }),
        new HtmlWebpackPlugin({
            title: '',
            filename: 'index.html',    //生成的html存放路径，相对于 path
            template:'./app/index.html',    //html模板路径
            favicon: './app/favicon.ico'

        }),
        new webpack.ProvidePlugin({
            $: "jquery",
            jQuery: "jquery",
            "windows.jQuery": "jquery"
        })
    ]
}
