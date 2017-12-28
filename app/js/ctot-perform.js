/**
 * 2017/12/18
 * author: liutianjiao
 * description: 监控入口
 */
var CTOTPerform = function(){

    var axios = require('axios')

    var baseUrl = 'http://192.168.243.83:8080/atmm-message-national-ctot-index-web/ctot/'
// var baseUrl = 'ctot/'
    var containerIds = ['errorAnalysis', 'stepAmplitude', 'stepTime']

    var loading = null
//选中的机场名称
    var airportName = ''

    var startDate = ''
    var endDate = ''

    var errorAnalysisChart = null
    var stepAmplitudeChart = null
    var stepTimeChart = null


//---------------------------------------------------
// 日期格式化
// 格式 YYYY/yyyy/YY/yy 表示年份
// MM/M 月份
// W/w 星期
// dd/DD/d/D 日期
// hh/HH/h/H 时间
// mm/m 分钟
// ss/SS/s/S 秒
//---------------------------------------------------
    Date.prototype.Format = function(formatStr) {
        var str = formatStr
        var Week = ['日', '一', '二', '三', '四', '五', '六']

        var year = this.getYear()
        str=str.replace(/yyyy|YYYY/, this.getFullYear())
        str=str.replace(/yy|YY/, (year % 100)>9?(year % 100).toString():'0' + (year % 100))

        var month = this.getMonth() + 1
        str=str.replace(/MM/, month>9?month.toString():'0' + month)
        str=str.replace(/M/g, month)

        str=str.replace(/w|W/g, Week[this.getDay()])

        str=str.replace(/dd|DD/, this.getDate()>9?this.getDate().toString():'0' + this.getDate())
        str=str.replace(/d|D/g, this.getDate())

        str=str.replace(/hh|HH/, this.getHours()>9?this.getHours().toString():'0' + this.getHours())
        str=str.replace(/h|H/g, this.getHours())
        str=str.replace(/mm/, this.getMinutes()>9?this.getMinutes().toString():'0' + this.getMinutes())
        str=str.replace(/m/g, this.getMinutes())

        str=str.replace(/ss|SS/, this.getSeconds()>9?this.getSeconds().toString():'0' + this.getSeconds())
        str=str.replace(/s|S/g, this.getSeconds())

        return str
    }

//初始化机场select
    var initSelect = function(){
        require('../plugins/bootstrap-select/css/bootstrap-select.min.css')
        require('bootstrap-select')
        $('.selectpicker').selectpicker({
            liveSearch: true,
            maxOptions: 1,
            size: 6,
            noneSelectedText: '请选择一个机场'
        }).on('hidden.bs.select', function () {
            var $this = $(this)
            var val = $this.val()
            if(null == val){
                //提示选择机场
            }else{
                airportName = val[0]
            }

        })
        $('.selectpicker').selectpicker('val', airportName)
    }

    /**
     * 初始化日期插件datepicker
     * */
    var initDatepicker = function () {
        require('bootstrap-datepicker/dist/css/bootstrap-datepicker.min.css')
        require('bootstrap-datepicker')
        require('bootstrap-datepicker/dist/locales/bootstrap-datepicker.zh-CN.min')
        $('.input-daterange').datepicker({
            format: 'yyyy/mm/dd',
            endDate: '0d',
            language: 'zh-CN',
            autoclose: true
        })
        var now = new Date()
        var nowDate = $.getFullTime(now).substring(0, 8)
        //七天前
        var day7Times = new Date().getTime() - (24*60*60*1000*7)
        var day7 = $.getFullTime(new Date( day7Times )).substring(0, 8)

        $('.input-daterange input[name="start"]').datepicker('setDate', $.parseFullTime(day7+'0000') )
        $('.input-daterange input[name="end"]').datepicker('setDate', $.parseFullTime(nowDate+'0000') )

        startDate = getDateValue('start')
        endDate = getDateValue('end')

    }

    /**
     *  设置日期为当前时间
     *  @param key 控件name值（start/end）
     */
    var setNowDate = function (key) {
        var nowDate = $.getFullTime(new Date()).substring(0, 8)
        $('.input-daterange input[name="'+key+'"]').datepicker('setDate', $.parseFullTime(nowDate+'0000') )
    }

    /**
     *  获取时间值
     *  @param key 控件name值（start/end）
     */
    var getDateValue = function (key) {
        return  $('.input-daterange input[name="'+key+'"]').val() || ''
    }

    /**
     * 绘制折线图，调用highcharts API
     * @param obj 集合对象
     */
    var drawLineChart = function(obj, chartObj){
        //更新
        if( chartObj ){
            var opt = {
                title: {
                    text: obj.title
                },
                subtitle: {
                    text: obj.subtitle
                },
                xAxis: {
                    categories : obj.xAxis.categories
                },
                series: [{
                    data: obj.series.data
                }]
            }
            chartObj.update(opt)
            return chartObj
        }else{
            //  创建图表配置
            var options = {
                chart: {
                    type: 'area',
                    zoomType: 'x',
                    resetZoomButton: {
                        position: {
                            y: -50
                        }
                    },
                    plotBackgroundImage: require('../images/blue.png')
                },
                title: {
                    text: obj.title || '', // 标题
                    style: {
                        fontSize: '28px',
                        color: '#656565'
                    }
                },
                subtitle: {
                    text: obj.subtitle || '',
                    style: {
                        fontSize: '18px',
                        color: '#777777'
                    }
                },
                legend: {
                    enabled: false
                },
                tooltip: {
                    shadow: true,         // 是否显示阴影
                    animation: true, // 是否启用动画效果
                    shared: true,
                    useHTML: true,
                    headerFormat : '<span style="font-size: 14px   padding-bottom: 5px  ">{point.key}</span><br/>',
                    pointFormat: '<span>'+ obj.tooltip.content.key +':{point.y}'+ obj.tooltip.content.unit +'</span>',
                    style: {            // 文字内容相关样式
                        fontSize: '16px',
                        fontWeight: 'blod'
                    }
                },
                xAxis: {// x 轴
                    categories: obj.xAxis.categories || [],
                    labels: {
                        style:{
                            fontSize: '14px'
                        },
                        formatter: function(){
                            var value = this.value
                            if(value.length != 8){
                                return value
                            }else{
                                return value.substring(0, 4) + '/' + value.substring(4, 6) + '/' + value.substring(6, 8)
                            }
                        }
                    },
                    crosshair: {
                        width: 1,
                        color: '#61a0a8'
                    },
                    tickColor: '#6b6b6b',
                    tickmarkPlacement: 'on',
                    startOnTick: false
                },
                yAxis: {// y轴
                    title: {
                        text: obj.yAxis.title,
                        style: {
                            fontSize: '16px',
                            color: '#777777'
                        },
                        x: -15
                    },
                    labels: {
                        style:{
                            fontSize: '14px'
                        }
                    },
                    allowDecimals:false, //是否允许小数
                    tickLength: 10, //坐标刻度线
                    tickWidth: 1,
                    tickColor: '#b1b1b1',
                    gridLineColor: '#c7c7c7'
                },
                plotOptions: {
                    series: {
                        fillColor: {
                            linearGradient: { x1: 0, y1: 1, x2: 0, y2: 0 },  //x水平  y垂直  方向
                            stops: [
                                [0,  'rgba(115, 126, 174, 0.05)'],
                                [1, 'rgba(115, 126, 174, 0.9)']
                            ]
                        },
                        marker: {
                            radius: 0
                        }
                    }
                },
                series: [{                // 数据列
                    name: obj.series.name,            // 数据列名
                    data: obj.series.data || [], // 数据
                    color: 'rgba(115, 126, 174, 0.9)'
                }]
            }
            var Highcharts = require('highcharts')

            Highcharts.setOptions({
                lang: {
                    resetZoom: '重置缩放比例',
                    resetZoomTitle: '重置缩放比例'
                }
            })

            var chart = Highcharts.chart(obj.containerId, options)
            $('.highcharts-credits').remove()
            return chart
        }

    }

    var getAvarage = function(dataArr){
        var len = dataArr.length
        if(len == 0 ){
            return 0
        }
        var sum = 0
        for(var n = 0  ; n < len ;  n++){
            sum += dataArr[n]*1
        }
        var avg = sum/len
        return avg.toFixed(2)
    }
//误差比率
    var drawCTOTErrorAnalysis = function(dataObj){
        dataObj = dataObj || {}
        var categoriesArr = Object.keys(dataObj) || []
        var dataArr = Object.values(dataObj) || []
        var avg = getAvarage(dataArr)
        avg = avg == 0 ? '-' : avg
        var options = {
            containerId: containerIds[0],
            title: (airportName || '') +'机场 CTOT误差比率',
            subtitle: startDate + '至' + endDate + '，平均' + avg + '%',
            tooltip: {
                content: {
                    key: '误差率',
                    unit: '%'
                }
            },
            xAxis: {
                categories : categoriesArr
            },
            yAxis: {
                title : '误 差 率 (%)'
            },
            series: {
                name: '误差率',
                data: dataArr
            }
        }

        errorAnalysisChart = drawLineChart(options, errorAnalysisChart)

    }
//跳变幅度
    var drawCTOTStepAmplitude = function(dataObj){
        dataObj = dataObj || {}
        var categoriesArr = Object.keys(dataObj) || []
        var dataArr = Object.values(dataObj) || []
        var avg = getAvarage(dataArr)
        avg = avg == 0 ? '-' : avg
        var options = {
            containerId: containerIds[1],
            title: (airportName || '') +'机场 CTOT跳变幅度',
            subtitle: startDate + '至' + endDate + '，平均' + avg + '分钟',
            tooltip: {
                content: {
                    key: '跳变幅度',
                    unit: ''
                }
            },
            xAxis: {
                categories : categoriesArr
            },
            yAxis: {
                title : '跳 变 幅 度(分钟)'
            },
            series: {
                name: '跳变幅度',
                data: dataArr
            }
        }
        stepAmplitudeChart = drawLineChart(options, stepAmplitudeChart)
    }
//跳变次数
    var drawCTOTStepTime = function(dataObj){
        dataObj = dataObj || {}
        var categoriesArr = Object.keys(dataObj) || []
        var dataArr = Object.values(dataObj) || []
        var avg = getAvarage(dataArr)
        avg = avg == 0 ? '-' : avg
        var options = {
            containerId: containerIds[2],
            title: (airportName || '') +'机场 CTOT跳变次数',
            subtitle: startDate + '至' + endDate + '，平均' + avg + '次',
            tooltip: {
                content: {
                    key: '跳变次数',
                    unit: '次'
                }
            },
            xAxis: {
                categories : categoriesArr
            },
            yAxis: {
                title : '跳 变 次 数 (次)'
            },
            series: {
                name: '跳变次数',
                data: dataArr
            }
        }
        stepTimeChart = drawLineChart(options, stepTimeChart)
    }

    var drawAllLineCharts = function(){
        drawCTOTErrorAnalysis()   //误差比率
        drawCTOTStepAmplitude()   //跳变幅度
        drawCTOTStepTime()   //跳变次数
    }
// 数据转换为图表结构
    var convertDataToChartDatas = function(list){
        var dataObj = {
            errorAnalysisDatas : {}, //误差比率数据
            stepAmplitudeDatas : {}, //跳变幅度数据
            stepTimeDatas : {} //跳变次数数据
        }
        var len = list.length
        if(len == 0){
            showMsg('warning', '未查询到数据', 10*1000)
        }else{
            //遍历数据
            for(var i = 0 ; i < len ; i++ ){
                var item = list[i]
                //日期
                var date = item.statisDate
                dataObj.errorAnalysisDatas[date] = ( item.ctotHopPercent || 0 ) * 1
                dataObj.stepAmplitudeDatas[date] = ( item.ctotHopScope || 0 ) * 1
                dataObj.stepTimeDatas[date] = ( item.ctotHopNumber || 0 ) * 1
            }
        }
        return dataObj
    }
    //ajax查询数据
    var searchData = function(){
        if($.isValidVariable(airportName) && $.isValidVariable(startDate) && $.isValidVariable(endDate)){
            loading.start()
            var endIndex = airportName.indexOf('-')
            var apName = airportName.substring(0, endIndex)
            var start = startDate.replace(/\//g, '')
            var end = endDate.replace(/\//g, '')
            var url = baseUrl + 'apName/' + apName + '/startDate/' + start+ '/endDate/' + end
            //请求数据
            axios.get(url)
                .then(function(response){
                    var json = response.data;
                    if( json ){
                        var status = json.status || ''
                        if( status*1 == 500 ){
                            showMsg('danger', json.error, 15*1000)
                            console.error(json.error)
                        }else if( status*1 == 200 ){
                            showMsg('success', '数据查询成功', 5*1000)
                            //数据时间
                            var $time = $('.time-content .value')
                            $time.html($.formatterFullTime(json.generateTime))
                            var list = json.flightCtotIndexListResult
                            //处理数据
                            var chartDatas = convertDataToChartDatas(list)
                            // 更新折线图
                            updateLineChart(chartDatas)
                        }
                    }else{
                        //数据为空
                        showMsg('danger', '未获取到数据', 10*1000)
                        console.error('send ' + baseUrl +'receive datas is null.')
                    }
                    setTimeout(function(){
                        loading.stop()
                    }, 1000)
                })
                .catch(function(err){
                    showMsg('danger', '请求接口异常', 10*1000)
                    loading.stop()
                    console.error(err);
                })
        }
    }

    /*
     * 提示信息展示
     *
     */
    var showMsg = function(type, content, clearTime){
        var $err = $('.error-content')
        $err.attr('class', 'error-content')
        var cont = ''
        switch (type){
            case 'success' : {
                cont = '成功: ' + content
                $err.addClass('alert-success')
                break
            }
            case 'warning' : {
                cont = '警告: ' + content
                $err.addClass('alert-warning')
                break
            }
            case 'danger' : {
                cont = '错误: ' + content
                $err.addClass('alert-danger')
                break
            }
        }
        $('.error-content').html(cont).addClass('active')
        if(clearTime*1){
            setTimeout(function () {
                $('.error-content').html('').removeClass('active')
            }, clearTime)
        }
    }
//查询事件
    var handleSearch = function () {
        var Ladda = require('ladda')
        loading = Ladda.create($('.search-btn')[0])
        $('.search-btn').on('click', function () {
            startDate = getDateValue('start')
            endDate = getDateValue('end')
            searchData()
        })
    }
// 更新折线图
    var updateLineChart = function(chartDatas){
        drawCTOTErrorAnalysis(chartDatas.errorAnalysisDatas)   //误差比率
        drawCTOTStepAmplitude(chartDatas.stepAmplitudeDatas)   //跳变幅度
        drawCTOTStepTime(chartDatas.stepTimeDatas)   //跳变次数
    }

//初始化组件
    var initComponents = function(){
        //初始化下拉框
        initSelect()
        //查询机场数据
        searchData()

    }

//获取机场值（用于展示在下拉框内）
    var getAirportsData = function(){
        var url = baseUrl + 'apNames'
        var $select = $('.airport-select')
        //请求数据
        axios.get(url)
            .then(function(response){
                var json = response.data
                if( json ){
                    var status = json.status || ''
                    $select.html('')
                    if( status*1 == 500 ){
                        $select.append('<option>无</option>')
                        console.error(json.error)
                    }else if( status*1 == 200 ){
                        var dataMap = json.apNamesMap
                        var keys = Object.keys(dataMap).sort()
                        //处理数据
                        for(var i in keys ){
                            var key = keys[i]
                            var value = dataMap[key]
                            if($.isValidVariable(value)){
                                var v = key + '-' + value
                                if( key == 'ZBAA'){
                                    airportName = v
                                }
                                $select.append('<option>'+ v +'</option>')
                            }
                        }
                    }
                    initComponents()
                }else{
                    //数据为空
                    console.error('未获取到机场列表数据')
                    console.error('send ' + baseUrl +'receive datas is null.')
                }
            })
            .catch(function(err){
                console.error('send ' + baseUrl +' error: ' + err)
            })
    }
    return {
        init: function(){
            //获取机场值（用于展示在下拉框内）
            getAirportsData()
            //初始化日期控件
            initDatepicker()
            //设置日期为当前时间
            setNowDate('end')
            //监听查询按钮
            handleSearch()
            //绘制折线图
            drawAllLineCharts()
        }
    }
}()

CTOTPerform.init()
