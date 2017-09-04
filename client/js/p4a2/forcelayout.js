var force_layout = {
    init: function() {
        var self = this;
        //console.log(testData)
        //draw
        // communicator
        self.addCommunicator();

      // self.setInitReadyData();
        self.forceLayout();
    },
    // communicator
    addCommunicator: function() {
        var self = this;
        self.identity = 'tdw';
        self.wsHost = '192.168.10.20'; //if you want to change it, then you should change them in the hub-ws.js
        self.wsPort = 15001;
        self.wsPath = '/ws';
        console.log("******start websocket******");

        self.ws = start_websocket(self.identity, self.wsHost, self.wsPort, self.wsPath, onmessage_callback = function(msg) {
            console.log('msg~~~~', msg);
            //console.log('msg~~~~~', msg.data);
            window.state = recv_state_update(msg.data);
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
    },
    sendMessage: function(msg, data) {
        var self = this;
        send_state_update(self.ws, self.identity, msg, data);
    },
    // state handlers
    greetingHandler: function(data) {
        var self = this;
        //alert('hello, ' + data.payload + ' from dblp search');
        var msgData = {};
        msgData.target = data.sender;
        msgData.ts = Date.parse(new Date());
        msgData.payload = "Jone";
        msgData = JSON.stringify(msgData);
        self.sendMessage('Bye', msgData);
    },
    getGraphLayoutHandler: function(data) {
        var self = this;
        dataPayload = data.payload;
        var result = self.calGraphLayoutResult(self.coauthorGraph)
        var msgData = {};
        msgData.target = data.sender;
        msgData.ts = Date.parse(new Date());
        msgData.payload = result;
        msgData = JSON.stringify(msgData);
        self.sendMessage('GraphLayout', msgData);
    },
    calGraphLayoutResult: function(data) {
        var self = this
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
            var r = calcRadius(d_node.paperNum)
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
    },
    selectTaskHandler: function(data) {
        var self = this;
        var wholeData = data;
        var dataPayload = data.payload;
        var task = dataPayload.task;
        var transitionTime = 2000;
        switch (task) {
            case 'taskOne':
                console.log('Start taskOne');

                setTimeout(function() {
                    self.setInitReadyData();
                }, transitionTime);
                break;
        }
    },
    highlightNodeArr: function(data) {

        var self = this;
        d3.selectAll('circle').style("fill", function(d) {
            if(d.expand == true)
                return window.Config.nodeColorExpand;
            else
                return window.Config.nodeColorNormal
        });
        var wholeData = data;
        data = data.payload.nodeArr
        console.log("receive photo");
        console.log(data);
        for (var i in data) {
            console.log('circle id', data[i])
            d3.select("#node" + data[i]).style("fill", window.Config.nodeColorSelect)
        }
        // my function -- change color red
    },
    nodeArrAnimationHandler: function(data) {
        var self = this;
        d3.selectAll('circle').style("fill", function(d) {
            if(d.expand == true)
                return window.Config.nodeColorExpand;
            else
                return window.Config.nodeColorNormal
        });
        var wholeData = data;
        data = data.payload;
        console.log("receive photo");
        var borderArray = {}
        borderArray.cx = []
        borderArray.cy = []
        var rMax = 0
        console.log(data)
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
    },
    expandNodeHandler: function(data) {

    },
    shrinkNodeHandler: function(data) {

    },

    setInitReadyData: function() {
        var self = this;
        self.coauthorGraph = readyData.coauthorGraph;
    },
    forceLayout: function() {
        var self = this
        var width = $('#graph').width()
        var height = $('#graph').height()
        var svg = d3.select('#graph').append('svg')
            .attr('width', width)
            .attr('height', height)
        self.width = width
        self.height = height
        self.svg = svg
        var linkWidth = window.Config.linkWidth
        var simulation = d3.forceSimulation()
            .force("link", d3.forceLink().id(function(d) {
                return d.id;
            }).distance(function(d) {
                if (d.source.type && d.source.degree) {
                    var sourceType = d.source.type
                    var targetType = d.source.type
                    var sourceDegree = d.source.degree
                    var targetDegree = d.target.degree
                    var num = Math.min(sourceDegree, targetDegree)
                    var linkDistance = window.Config.linkDistance
                    if (sourceType === targetType) {
                        if (sourceType === 'root') {
                            if (num > 30) {
                                if (num > 50) {
                                    return linkDistance * 6
                                } else {
                                    return linkDistance * 4
                                }
                            } else {
                                if (num > 20) {
                                    return linkDistance * 3
                                } else {
                                    return linkDistance * 2
                                }
                            }
                        } else {
                            return linkDistance * 5
                        }
                    } else {
                        if ((sourceType === 'root' && sourceDegree > 5) || (targetType === 'root' && targetDegree > 5)) {
                            return linkDistance * 5
                        } else {
                            return linkDistance * 4
                        }
                    }

                }
                return 10
            }))
            .force("charge", d3.forceManyBody().strength(function(d) {
                var charge = window.Config.charge
                if (d.type) {
                    if (d.type === 'root') {
                        if (d.degree < 10) {
                            return charge
                        } else if (d.degree < 20) {
                            return charge * 2
                        } else if (d.degree < 30) {
                            return charge * 3
                        } else if (d.degree < 40) {
                            return charge * 4.5
                        } else if (d.degree < 50) {
                            return charge * 5
                        } else if (d.degree < 100) {
                            return charge * 6
                        } else {
                            return charge * 7
                        }
                    }
                    if (d.type === 'leaf') {
                        return charge * 3
                    }
                }
                return charge
            }))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force('X', d3.forceX().x(0).strength(0.02))
            .force('Y', d3.forceY().y(0).strength(0.2))

        // nodes79links292
        //nodes5238links17953
        // nodes
        d3.json("data/nodes527links1705.json", function(error, graph) {

            if (error) throw error;
            self.coauthorGraph = graph.coauthorGraph
            var nodesData = graph.coauthorGraph.nodes
            self.nodesData = nodesData
            for (var i in nodesData) {
                var tmpId = nodesData[i].id
                nodesData[i].id = nodesData[i].index
                nodesData[i]['nameid'] = tmpId
                nodesData[i]['expand'] = false // true表示可以expand  false表示可以shrink
                nodesData[i]['shrink'] = false // true表示可以shrink false表示不可以shrink
                nodesData[i]['neighbor'] = [] // 记录邻居节点
                nodesData[i]['neighborLinksIndex'] = [] // 记录邻居边的id
                nodesData[i]['nodesToExpand'] = [] // 表示需要扩展出的节点的id
                nodesData[i]['nodesToShrink'] = [] // 表示需要收缩回的节点的id
                
            }

            graph.coauthorGraph.nodes = nodesData
            self.coauthorGraph = graph.coauthorGraph
            var linksData = graph.coauthorGraph.links
            self.linksData = linksData
            console.log(nodesData)
            console.log(linksData)

            // 对边进行处理，求出每个点的邻居
            for (var i in linksData) {
                nodesData[linksData[i].target].neighbor.push(linksData[i].source)
                nodesData[linksData[i].target].neighborLinksIndex[linksData[i].source] = i

                nodesData[linksData[i].source].neighbor.push(linksData[i].target)
                nodesData[linksData[i].source].neighborLinksIndex[linksData[i].target] = i
            }

            var initNodesData = []
            var initLinksData = []
            // 设置初始节点为Xiaoru Yuan及其邻居节点，设置初始数据集
            // 先添加所有节点
            initNodesData.push(nodesData[0]) // 添加中心节点
            for (var i in nodesData[0].neighbor){
                initNodesData.push(nodesData[nodesData[0].neighbor[i]]) // 添加邻居节点       
            }
            // 对每个节点来添加边
            for (var i in initNodesData){
                for (var j in initNodesData[i].neighbor){ // 查看当前集合中节点的每一个邻居节点
                    var thisNeighborId = initNodesData[i].neighbor[j] // 获得这一邻居节点的id
                    if($.inArray(nodesData[thisNeighborId], initNodesData) != -1) { // 说明这个邻居在现在点集中,需要增加边
                        var thisLinkId = initNodesData[i].neighborLinksIndex[thisNeighborId] // 要增加的这条边的id
                        if($.inArray(linksData[thisLinkId], initLinksData) == -1) {// 没添加过这条边的时候，添加
                            initLinksData.push(linksData[thisLinkId])
                        }
                    } else { // 说明这个邻居不在现在的点集中，即当前节点还能继续扩展
                        // ***考虑需要把nodesData中的点也进行修改
                        initNodesData[i].expand = true
                        initNodesData[i].nodesToExpand.push(thisNeighborId) // 记录这点可以扩展的邻居节点
                    }
                }
            }

       
            var link = svg.append("g")
                .attr("class", "links")
                .selectAll("line")
                .data(initLinksData)
                .enter()
                .append("line")
                .attr("stroke-width", function(d) {
                    return linkWidth;
                })
                .attr("stroke", "#999")
                .attr("stroke-opacity", 0.6)

            svg.append('text')
                .text('Nodes ' + nodesData.length)
                .attr('x', 10)
                .attr('y', 20)
            svg.append('text')
                .text('Edges ' + linksData.length)
                .attr('x', 10)
                .attr('y', 40)

            var node = svg.append("g")
                .attr("class", "nodes")
                .selectAll("circle")
                .data(initNodesData)
                .enter().append("circle")
                .attr('class', 'circles')
                .attr("r", function(d) {
                    return calcRadius(d.paperNum)
                })
                .attr("id", function(d) {
                    return 'node' + d.nameid
                })
                .attr("fill", function(d) {
                    if(d.expand == true)
                        return window.Config.nodeColorExpand;
                    else
                        return window.Config.nodeColorNormal;
                })
                .attr('stroke', function(d) {
                    if(d.expand == true)
                        return window.Config.strokeColorExpand
                    else
                        return "none"
                })
                .attr('stroke-width', "5px")
                .call(d3.drag()
                    .on("start", self.dragstarted)
                    .on("drag", self.dragged)
                    .on("end", self.dragended));
            var node_name = svg.selectAll("name_text")
                .attr("class", "name_text")
                .data(initNodesData)
                .enter().append("text")
                .style("fill","black")
                .attr("dx", 5)
                .attr("dy", 5)
                .text(function(d){
                    if(d.type === "root")
                        return d.name
                }) 
            node.append("title")
                .text(function(d) {
                    return d.name + ' ' + 'PaperNum ' + d.paperNum;
                });

            simulation
                .nodes(initNodesData)
                .on("tick", ticked)

            simulation.force("link")
                .links(initLinksData)

            var padding = 50
            window.simulation = simulation

            var extendTimes;
            console.log(initNodesData.length/100)
            switch (Math.floor(initNodesData.length / 100)){
                case 0:
                    extendTimes = 0.5
                    break;
                case 1:
                    extendTimes = 0.6
                    break;
                case 2:
                    extendTimes = 0.68
                    break;
                case 3:
                    extendTimes = 0.75
                    break;
                case 4:
                    extendTimes = 0.8
                    break;
                case 5:
                    extendTimes = 0.9
                    break;
            }
            console.log(extendTimes)
            function ticked() {

                var minH = 10000000
                var maxH = -1
                var minW = 10000000
                var maxW = -1
                link
                    .attr("x1", function(d) {
                        return d.source.x;
                    })
                    .attr("y1", function(d) {
                        return d.source.y;
                    })
                    .attr("x2", function(d) {
                        return d.target.x;
                    })
                    .attr("y2", function(d) {
                        return d.target.y;
                    });

                node
                    .attr("cx", function(d) {
                        minW = Math.min(minW, d.x);
                        maxW = Math.max(maxW, d.x);
                        return d.x;
                    })
                    .attr("cy", function(d) {
                        minH = Math.min(minH, d.y);
                        maxH = Math.max(maxH, d.y);
                        return d.y;
                    });
                node_name.attr("x",function(d){
                        return d.x + 10;
                    })
                    .attr("y",function(d){
                        return d.y - 10;
                    });

                if (simulation.alpha() < 0.01) {
                    //console.log(minW, maxW, minH, maxH)
                    if (minW < padding || maxW > self.width - padding) {
                        //console.log(minW, minH, maxH, maxW)
                        node.attr('cx', function(d) {
                            d.x = (d.x - minW - (maxW - minW) / 2) / (maxW - minW) * (self.width - padding * 2) + self.width / 2
                                //console.log(d.x)
                            return d.x
                            })

                        node_name
                            .attr('x', function(d) {
                                return d.x + 10
                            })
                        link
                            .attr("x1", function(d) {
                                return d.source.x;
                            })
                            .attr("y1", function(d) {
                                return d.source.y;
                            })
                            .attr("x2", function(d) {
                                return d.target.x;
                            })
                            .attr("y2", function(d) {
                                return d.target.y;
                            });
                        $("#load").css('display', 'none');
                        $("#graph").css('display', 'block');
                        simulation.restart()
                    }
                    if (minH < padding || maxH > self.height - padding) {
                        //console.log(minW, minH, maxH, maxW)
                        node
                            .attr('cy', function(d) {
                                d.y = (d.y - minH - (maxH - minH) / 2) / (maxH - minH) * (self.height - padding * 2) + self.height / 2
                                return d.y
                            })
                        node_name
                            .attr('y', function(d) {
                                return d.y - 10
                            })
                        link
                            .attr("x1", function(d) {
                                return d.source.x;
                            })
                            .attr("y1", function(d) {
                                return d.source.y;
                            })
                            .attr("x2", function(d) {
                                return d.target.x;
                            })
                            .attr("y2", function(d) {
                                return d.target.y;
                            });
                        $("#load").css('display', 'none');
                        $("#graph").css('display', 'block');
                        simulation.restart()
                    }
                    
                    // 扩展点
                    var n_totalW = maxW - minW;
                    if (n_totalW < (self.width - 2 * padding) * extendTimes) {
                        node
                            .attr('cx', function(d) {
                                d.x = (d.x - minW - (maxW - minW) / 2) / (maxW - minW) * (self.width - padding * 2) * extendTimes + self.width / 2
                                return d.x
                            })
                        node_name
                            .attr('x', function(d) {
                                return d.x + 10
                            })

                        link
                            .attr("x1", function(d) {
                                return d.source.x;
                            })
                            .attr("y1", function(d) {
                                return d.source.y;
                            })
                            .attr("x2", function(d) {
                                return d.target.x;
                            })
                            .attr("y2", function(d) {
                                return d.target.y;
                            });
                        $("#load").css('display', 'none');
                        $("#graph").css('display', 'block');
                        simulation.restart()

                    }
                    var n_totalH = maxH - minH;
                    if (n_totalH < (self.height - 2 * padding) * extendTimes) {
                        node
                            .attr('cy', function(d) {
                                d.y = (d.y - minH - (maxH - minH) / 2) / (maxH - minH) * (self.height - padding * 2) * extendTimes + self.height / 2
                                return d.y
                            })
                        node_name
                            .attr('y', function(d) {
                                return d.y - 10
                            })
                        link
                            .attr("x1", function(d) {
                                return d.source.x;
                            })
                            .attr("y1", function(d) {
                                return d.source.y;
                            })
                            .attr("x2", function(d) {
                                return d.target.x;
                            })
                            .attr("y2", function(d) {
                                return d.target.y;
                            });
                        $("#load").css('display', 'none');
                        $("#graph").css('display', 'block');
                        simulation.restart()

                    }

                }
                if (simulation.alpha() < 0.01) {
                    $("#load").css('display', 'none');
                    $("#graph").css('display', 'block');
                }
            }

        });
    },

    edgeBundling: function() {
        var self = this
        var bundleNodes = new Object()
        self.nodesData.forEach(function(d) {
            var id = d.id + ''
            bundleNodes[id] = { 'x': d.x, 'y': d.y }

        })
        var bundleEdges = []
        self.linksData.forEach(function(d) {
                bundleEdges.push({ 'source': d.source.id + '', 'target': '' + d.target.id })
            })
            // console.log(bundleEdges, bundleNodes)
        var fbundling = d3.ForceEdgeBundling()
            .nodes(bundleNodes)
            .edges(bundleEdges);
        var results = fbundling();
        var d3line = d3.line()
            .x(function(d) {
                return d.x;
            })
            .y(function(d) {
                return d.y;
            })

        console.log(results)

        var svg = self.svg
        svg.selectAll('.links').remove()
        svg.selectAll('.nodes').remove()
        results.forEach(function(edge_subpoint_data) {

            svg.append("path")
                .attr("d", d3line(edge_subpoint_data))
                .attr("stroke-width", function(d) {
                    return window.Config.linkWidth;
                })
                .attr("stroke", "#999")
                .attr("stroke-opacity", 0.6)
                .attr('fill', 'none')
        });
        svg.append("g")
            .attr("class", "nodes")
            .selectAll("circle")
            .data(self.nodesData)
            .enter().append("circle")
            .attr('class', 'circles')
            .attr("r", function(d) {

                return calcRadius(d.paperNum)
            })
            .attr("id", function(d) {
                return 'node' + d.nameid
            })
            .attr("cx", function(d) {
                return bundleNodes[d.index].x
            })
            .attr("cy", function(d) {
                return bundleNodes[d.index].y
            })
            .attr("fill", function(d) {
                return window.Config.nodeColor;
            })
            .call(d3.drag()
                .on("start", self.dragstarted)
                .on("drag", self.dragged)
                .on("end", self.dragended));
    },

    dragstarted: function(d) {
        var simulation = window.simulation
        if (!d3.event.active) simulation.alphaTarget(0.01).restart();
        d.fx = d.x;
        d.fy = d.y;
    },

    dragged: function(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
    },

    dragended: function(d) {
        var simulation = window.simulation
        if (!d3.event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }
}

function calcRadius(paperNum) {
    return Math.pow(paperNum, 0.4) + 10
}
//function for websocket to communicate with phone
function send_state_update(ws, identity, name, data) {
    buf = msgpack.encode([identity, name, data]);
    ws.send(buf);
}

function recv_state_update(buf) {
    state = msgpack.decode(new Uint8Array(buf));
    info = {
        "sender": state[0],
        "name": state[1],
        "data": state[2]
    };
    return info;
}

function start_websocket(identity, ws_host, ws_port, ws_path, onmessage_callback, onopen_callback, onclose_callback) {
    ws = new WebSocket("ws://" + ws_host + ":" + ws_port + ws_path);
    ws.identity = identity;
    ws.binaryType = "arraybuffer";
    if (onmessage_callback !== null) ws.onmessage = onmessage_callback;
    if (onopen_callback !== null) ws.onopen = onopen_callback;
    if (onclose_callback !== null) ws.onclose = onclose_callback;
    return ws;
}
