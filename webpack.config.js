/*
 * @file webpack配置文件(开发环境)
 * @author liutianjiao
 * @date 2017-12-28
 */
var path = require('path');
var webpack = require('webpack');
var HtmlWebpackPlugin = require('html-webpack-plugin');
module.exports = {
    devtool: "source-map",
    entry: './app/js/index.js', //入口文件
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
                test: /\.css$/,
                use: [
                    'style-loader',
                    'css-loader?#sourceMap'
                ],
            },
            {
                test: /\.eot|woff|eot|ttf|svg$/,
                use: ['file-loader']
            },
            {
                test: /\.png$/,
                use: 'url-loader?limit=1048576',
            },
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({                        //根据模板插入css/js等生成最终HTML
            title: '',
            filename:'index.html',    //生成的html存放路径，相对于 path
            template:'./app/index.html',    //html模板路径
        }),
        new webpack.ProvidePlugin({
            $: "jquery",
            jQuery: "jquery",
            "windows.jQuery": "jquery"
        })
    ],
    devServer: {
        compress: true, // 启用gzip压缩
        contentBase: path.join(__dirname, 'app'),
        port: 3003, // 运行端口3000
        inline: true,
        hot: true,
        historyApiFallback: true,
    },
}