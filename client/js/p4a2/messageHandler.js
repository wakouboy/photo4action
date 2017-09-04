var message_handler = function() {
    var self = this
    self.identity = 'tdw';
    self.wsHost = '192.168.10.20'; //if you want to change it, then you should change them in the hub-ws.js
    // self.wsHost = '192.168.40.30'
    self.wsPort = 15001;
    self.wsPath = '/ws';
    console.log("******start websocket******");

    self.ws = self.start_websocket(self.identity, self.wsHost, self.wsPort, self.wsPath, onmessage_callback = function(msg) {
        console.log('msg~~~~', msg);
        //console.log('msg~~~~~', msg.data);
        window.state = self.recv_state_update(msg.data);
        if (typeof state.data !== "string") {
            state.data = String.fromCharCode.apply(null, new Uint8Array(state.data));
        }

        state.data = JSON.parse(state.data);
        state.data.sender = state.sender;
        state.data.name = state.name;
        console.log(state.name, state.data)
        if (state.data.target === "tdw" || state.data.target === "" || state.data.target === undefined) {

            if (state.sender === self.identity) return;
            self.dataFromPhone = {};
            self.dataFromPhone.sender = state.data.sender;
            self.dataFromPhone.name = state.data.name;
            self.dataFromPhone.data = state.data.payload;

            switch (state.name) {
                case 'Hello':
                    self.greetingHandler(state.data);
                    break;
                case 'SelectTask':
                    self.selectTaskHandler(state.data);
                    break;
                case 'GetGraphLayout':
                    self.getGraphLayoutHandler(state.data);
                    break;
                case 'NodeArrAnimation':
                    self.nodeArrAnimationHandler(state.data);
                    break
                case 'HighlightNodeArr':
                    self.highlightNodeArr(state.data);
                    break;
                case 'ExpandNode':
                    self.expandNodeHandler(state.data);
                    break;
                case 'ShrinkNode':
                    self.shrinkNodeHandler(state.data);
                    break;
            }
        }
    });

}

message_handler.prototype.start_websocket = function(identity, ws_host, ws_port, ws_path, onmessage_callback, onopen_callback, onclose_callback) {
    ws = new WebSocket("ws://" + ws_host + ":" + ws_port + ws_path);
    ws.identity = identity;
    ws.binaryType = "arraybuffer";
    if (onmessage_callback !== null) ws.onmessage = onmessage_callback;
    if (onopen_callback !== null) ws.onopen = onopen_callback;
    if (onclose_callback !== null) ws.onclose = onclose_callback;
    return ws;
}
message_handler.prototype.sendMessage = function(msg, data) {
    var self = this;
    self.send_state_update(self.ws, self.identity, msg, data);
}

message_handler.prototype.greetingHandler = function(data) {
    var self = this;
    //alert('hello, ' + data.payload + ' from dblp search');
    var msgData = {};
    msgData.target = data.sender;
    msgData.ts = Date.parse(new Date());
    msgData.payload = {
        nodeColorNormal: window.nodeColorNormal,
        nodeColorExpand: window.nodeColorExpand,
        strokeColorExpand: window.strokeColorExpand,
        nodeColorSelect: window.nodeColorSelect,
        strokeColorSelect: window.strokeColorSelect
    };
    msgData = JSON.stringify(msgData);
    self.sendMessage('Bye', msgData);
}

message_handler.prototype.getGraphLayoutHandler = function(data) {
    var self = this;
    dataPayload = data.payload;
    var result = self.calGraphLayoutResult(self.coauthorGraph)
    var msgData = {};
    msgData.target = data.sender;
    msgData.ts = Date.parse(new Date());
    msgData.payload = result;
    msgData = JSON.stringify(msgData);
    self.sendMessage('GraphLayout', msgData);
}


message_handler.prototype.calGraphLayoutResult = function() {
    var self = this
    console.log(window.forceLayout)
    var data = forceLayout.initGraphData;

    console.log("***************")
        //console.log(data.nodes)
    console.log("***************", data)
    var resultData = {};
    resultData.nodes = [];
    resultData.links = {};
    data.nodes.forEach(function(d_node, i_node) {
        var obj = [];
        var x = Math.floor(d_node.x);
        var y = Math.floor(d_node.y);
        //console.log(d_node.id+ " x "+ d_node.x + " y " + d_node.y );
        var r = d_node.r
        var id = d_node.nameid;
        var name = d_node.name;
        var type = d_node.type
        obj.push(x);
        obj.push(y);
        obj.push(r);
        obj.push(id);
        obj.push(name);
        obj.push(type)
        resultData.nodes.push(obj);
    });

    data.links.forEach(function(d_link, i_link) {
        var sourceNameId = d_link.source.nameid;
        var targetNameId = d_link.target.nameid;
        if (resultData.links[sourceNameId] === undefined) {
            resultData.links[sourceNameId] = [];
        }
        if (resultData.links[targetNameId] === undefined) {
            resultData.links[targetNameId] = [];
        }
        resultData.links[sourceNameId].push(targetNameId);
        resultData.links[targetNameId].push(sourceNameId)
    });
    console.log(resultData)
    return resultData;
}


message_handler.prototype.highlightNodeArr = function(data) {

    d3.selectAll('circle').style("fill", function(d) {
        if (d.expand == true)
            return window.Config.nodeColorExpand;
        else
            return window.Config.nodeColorNormal
    });
    var wholeData = data;
    data = data.payload.nodeArr
    for (var i in data) {
        console.log('circle id', data[i])
        d3.select("#node" + data[i]).style("fill", window.Config.nodeColorSelect)
    }
    // my function -- change color red
}


message_handler.prototype.nodeArrAnimationHandler = function(data) {
    var self = this;
    d3.selectAll('circle').style("fill", function(d) {
        if (d.expand == true)
            return window.Config.nodeColorExpand;
        else
            return window.Config.nodeColorNormal;
    });
    var wholeData = data;
    data = data.payload;
    console.log("receive photo");
    var borderArray = {}
    borderArray.cx = []
    borderArray.cy = []
    var rMax = 0

    d3.select("#rectBorder").remove()
    for (var i in data) {
        console.log('circle id', data[i])
        var selectionNode = d3.select("#node" + data[i])
        borderArray.cx.push(+selectionNode.attr("cx"))
        borderArray.cy.push(+selectionNode.attr("cy"))
        rMax = Math.max(rMax, +selectionNode.attr("r"))
        selectionNode.style("fill", window.Config.nodeColorSelect)
    }
    var selectionBorder = {}
    selectionBorder.left = d3.min(borderArray.cx)
    selectionBorder.right = d3.max(borderArray.cx)
    selectionBorder.top = d3.min(borderArray.cy)
    selectionBorder.bottom = d3.max(borderArray.cy)
    console.log(borderArray)
    console.log(selectionBorder)
    d3.select("svg").append("rect")
        .attr("id", "rectBorder")
        .attr("x", selectionBorder.left - rMax)
        .attr("y", selectionBorder.top - rMax)
        .attr("width", selectionBorder.right - selectionBorder.left + 2 * rMax)
        .attr("height", selectionBorder.bottom - selectionBorder.top + 2 * rMax)
        .attr("stroke", window.Config.strokeColorSelect)
        .attr("fill", 'none')
        .attr("stroke-width", "2px")
        .attr("opacity", 0.7)
}

message_handler.prototype.expandNodeHandler = function(data) {
    var forceLayout = window.forceLayout
    var nodesData = forceLayout.initGraphData.nodes
    var expandNodeWeb = window.expandNodeWeb
    data = data.payload.nodeArr
    console.log('expand node', data)
    for (var i in data) {
        for (var j in nodesData) {
            if (nodesData[j].nameid === data[i]) {
                // console.log(data[i])
                expandNodeWeb.addData(nodesData[j])
            }
        }
    }

}

message_handler.prototype.shrinkNodeHandler = function(data) {

}


message_handler.prototype.recv_state_update = function(buf) {
    state = msgpack.decode(new Uint8Array(buf));
    info = {
        "sender": state[0],
        "name": state[1],
        "data": state[2]
    };
    return info;
}
message_handler.prototype.send_state_update = function(ws, identity, name, data) {
    buf = msgpack.encode([identity, name, data]);
    ws.send(buf);
}
