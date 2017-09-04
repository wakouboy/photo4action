

var wsUrl= "ws://192.168.10.8:8765/ws"

var ws = new WebSocket(wsUrl)
var wsOK = $.Deferred()


var filename = new Date() + 't'

 
ws.onopen = function(){
	console.log("Connected!")
	searchAuthorByNameArr(initSearchName)
	wsOK.resolve()
}

ws.onmessage = function(evt){
	var msg_received = JSON.parse(evt.data)
	console.log("Msg_received: " + msg_received.message)
	var nodeNum = msg_received.data.coauthorGraph.nodes.length
	var linkNum = msg_received.data.coauthorGraph.links.length
	console.log("data size", msg_received.data.coauthorGraph.nodes.length, msg_received.data.coauthorGraph.links.length)
	var data = JSON.stringify(msg_received.data)
    var blob = new Blob([data], {type: "application/json"})
    var url = URL.createObjectURL(blob)
    var a = document.createElement('a');
    a.download    = "nodes"+nodeNum+"links"+linkNum+".json";
    a.href        = url;
    a.textContent = "Download dblpgraph.json";

    document.getElementById('content').appendChild(a);
	
}
ws.onclose = function(){
	console.log("Closed")
}

send = function(message, data){
	var msg_to_sent = JSON.stringify({
		message: message,
		data: data
	})
	console.log(data)
	wsOK.done(function(){
		console.log("sss")
		console.log(msg_to_sent)
		ws.send(msg_to_sent)
	})
	//ws.send(msg_to_sent)

	
}
searchAuthorByNameArr = function(value){
	var message = 'authorNameArr'
	console.log("serach name")
	var rootAuthorList = []
	var dataObj = {}
	dataObj.data = JSON.stringify(value)
	dataObj.rootAuthorList = JSON.stringify(rootAuthorList)
	send(message, dataObj)
}

// initSearchName = ['Kwan-Liu Ma', 'Xiaoru Yuan', 'Jie Liang','Qing Li', 'Jing Li','Wei Li', 'Chen Wang', 'Thomas Ertl'
// , 'Xin Zhang','Jiawan Zhang', 'Hans-Peter Seidel', 'Daniel A. Keim', 'Shixia Liu','Tobias H\u00f6llerer', 'Huamin Qu', 'Robert B. Ross', 'Han-Wei Shen', 'Jian Huang','Ke Zhang'
// ,'Bernhard Preim','Tzi-cker Chiueh', 'Baining Guo','Liang Chen', 'Dhabaleswar K. Panda','Ke Zhang','Yifan Hu' ]
// initSearchName = ['Jie Liang','Huijing Zhao','Junping Zhang','Baoquan Chen', 'Xiaoru Yuan','Jiawan Zhang','Yang Shi','Huamin Qu','Chen Yang','Bedrich Benes','Daniel Cohen-Or','Yizhou Yu','Hongbin Zha','Jizhou Sun','Xiaochun Cao','Qing Chen','Tianyu Wang','Albert C. S. Chung','Jon Atle Gulla','Vijayan Sugumaran','Peter Herrmann'
// ,'Heiko Krumm','Stephen T. C. Wong','Ghassan Beydoun','Pau-Choo Chung','Gerald E. Sobelman','Lin Shi','Mingshu Li','Li Ruan','Quang Vinh Nguyen','Tom Hintz','Lu Lu','Xiaoli Zhang','Bhaskar DasGupta','Yongsheng Gao','Jizheng Xu','Yong Peng','Si Wu','Mahmoud Al-Qutayri','Min Lu','Yadong Wu','Jie Cao']
initSearchName = ['Xiaoru Yuan', 'Zhigang Deng', 'Nan Cao', 'Jiawan Zhang', 'Huijing Zhao', 'Baoquan Chen', 'Junping Zhang', 'Bedrich Benes']