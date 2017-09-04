var force_layout = function(v_panelSelectcor) {
    var self = this;
    self.panelSelectcor = v_panelSelectcor;

    self.nodeSize = 4;
    self.linkWidth = 1;
    // id type = id / index
    self.linkNodeMappingType = 'id';
    self.linkDistance = 20;
    self.linkStrength = 0.7;
    // 点的strength，正值，表示相互吸引，负值表示相互排斥
    self.nodeStrength = -200;
    self.collideStrength = 0.7;

    self.init();
}

force_layout.prototype.init = function() {
    var self = this;
    var panelSelectcor = self.panelSelectcor;
    var width = $(panelSelectcor).width(),
        height = $(panelSelectcor).height();
    var margin = { 'left': 10, 'right': 10, 'top': 10, 'bottom': 10 };
    var viewWidth = width - margin.left - margin.right,
        viewHeight = height - margin.top - margin.bottom;
    // init svg
    if (!d3.select(panelSelectcor + ' svg')._groups[0][0])
        d3.select(panelSelectcor).append('svg');
    var svg = d3.select(panelSelectcor + ' svg').attr('width', width).attr('height', height);
    var view = svg.append('g').attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');
    var linkView = view.append('g').attr('class', 'linkView');
    var nodeView = view.append('g').attr('class', 'nodeView');
    var textView = view.append('g').attr('class', 'textView')

    self.viewWidth = viewWidth;
    self.viewHeight = viewHeight;
    self.linkView = linkView;
    self.nodeView = nodeView;
    self.textView = textView;

}

force_layout.prototype.setData = function(v_data) {
    var self = this;
    self.dataProcess(v_data);
    console.log(v_data)
    self.graphData = v_data.coauthorGraph; // 全局的graphData
    self.initGraphData = v_data.initGraph; // 初始的graphData
    self.handleGraph();
}

force_layout.prototype.dataProcess = function(graph) {
    var nodesData = graph.coauthorGraph.nodes
    var attrNodesData = []
    var attrLinksData = []
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
    var linksData = graph.coauthorGraph.links

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
    for (var i in nodesData[0].neighbor) {
        initNodesData.push(nodesData[nodesData[0].neighbor[i]]) // 添加邻居节点       
    }
    // 对每个节点来添加边
    for (var i in initNodesData) {
        for (var j in initNodesData[i].neighbor) { // 查看当前集合中节点的每一个邻居节点
            var thisNeighborId = initNodesData[i].neighbor[j] // 获得这一邻居节点的id
            if ($.inArray(nodesData[thisNeighborId], initNodesData) != -1) { // 说明这个邻居在现在点集中,需要增加边
                var thisLinkId = initNodesData[i].neighborLinksIndex[thisNeighborId] // 要增加的这条边的id
                if ($.inArray(linksData[thisLinkId], initLinksData) == -1) { // 没添加过这条边的时候，添加
                    initLinksData.push(linksData[thisLinkId])
                }
            } else { // 说明这个邻居不在现在的点集中，即当前节点还能继续扩展
                // ***考虑需要把nodesData中的点也进行修改
                initNodesData[i].expand = true
                initNodesData[i].nodesToExpand.push(thisNeighborId) // 记录这点可以扩展的邻居节点
            }
        }
    }

    graph.initGraph = {}
    graph.initGraph.nodes = initNodesData
    graph.initGraph.links = initLinksData
    graph.coauthorGraph.nodes = nodesData
    graph.coauthorGraph.links = linksData
    var extendTimes;
    console.log(initNodesData.length / 100)
    switch (Math.floor(initNodesData.length / 100)) {
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
    self.extendTimes = extendTimes
}
force_layout.prototype.handleGraph = function() {
    var self = this;
    self.f_simulation = d3.forceSimulation();
    self.f_center = d3.forceCenter(0, 0);
    self.f_manyBody = d3.forceManyBody();
    self.f_link = d3.forceLink();
    self.f_collide = d3.forceCollide();
    self.draw();
    self.calGraph();
}

force_layout.prototype.draw = function() {
    var self = this;
    var nodeView = self.nodeView,
        linkView = self.linkView,
        textView = self.textView,
        graph = self.initGraphData,
        nodeSize = self.nodeSize,
        linkWidth = self.linkWidth,
        f_simulation = self.f_simulation;
    var nodes = nodeView.selectAll('.node').data(graph['nodes']);
    var newNodes = nodes.enter();
    newNodes.append('circle').attr('class', 'node').append('title').text(function(d) {
        return d.name
    });
    nodes.exit().remove();
    console.log(nodes)
    nodeView.selectAll('.node').attr('cx', 0).attr('cy', 0)
        .attr('r', function(d) {
            d.r = nodeSize / 6 * Math.pow(d.paperNum, 0.4) + 3;
            return nodeSize / 6 * Math.pow(d.paperNum, 0.4) + 3;
        })
        .attr("id", function(d) {
            return 'node' + d.nameid
        })
        .attr("fill", function(d) {
            if (d.expand == true)
                return window.Config.nodeColorExpand;
            else
                return window.Config.nodeColorNormal;
        })
        .attr('stroke', function(d) {
            if (d.expand == true)
                return window.Config.strokeColorExpand
            else
                return "none"
        })
        .attr('stroke-width', window.Config.strokeWidth)
        .on("click", function(d) {
            console.log("是否可扩展", d.expand)
            console.log("可以扩展出的节点id", d.nodesToExpand)
            if (d.expand == true) {
                window.expandNodeWeb.addData(d)
                    //window.messageHandler.expandNodeHandler([d.nameid])
                self.update()
            }
        })
        .call(d3.drag()
            // .container(nodeView)
            .subject(dragsubject)
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    var links = linkView.selectAll('.link').data(graph['links']);
    var newLinks = links.enter().append('line').attr('class', 'link').attr('stroke-width', linkWidth)
    links.exit().remove();
    linkView.selectAll('.link').attr('d', function(d, i) {
        return 'M 0 0 L 0 0';
    });

    var texts = textView.selectAll('.text').data(graph['nodes']);
    var newTexts = texts.enter().append('text').attr('class', 'text')
    texts.exit().remove();
    textView.selectAll('.text').text(function(d) {
            return d.name;
        }).attr('dx', function(d){
            return nodeSize / 6 * Math.pow(d.paperNum, 0.4) + 3 + 10;
        })
        // .attr('dy', '.35em')
        .attr('display', function(d) {
            if (d.type === 'root' || d.expand) return 'block';
            else return 'none';
        })
        .style('font-size', function(d) {
            return nodeSize / 3 * Math.pow(d.paperNum, 0.4) + 3 +'px';
        })
    console.log(nodeSize * 4 + 'px')
    function dragsubject() {
        return f_simulation.find(d3.event.x, d3.event.y);
    }

    function dragstarted(d) {
        console.log("dragstarted")
            //if (!d3.event.active) f_simulation.alphaTarget(0.2).restart();
            // d.fx = d.x;
            // d.fy = d.y;
            // d.fixed = true;

    }

    function dragged(d) {
        // console.log(d.fx, d3.event.x)
        // console.log(d.fy, d3.event.y)
        // d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);
        // linkView.selectAll('.link').attr()
        // d.fx = d3.event.x;
        // d.fy = d3.event.y;
    }

    function dragended(d) {
        // if (!d3.event.active) f_simulation.alphaTarget(0);
        // d.fixed = true;
        // d.fx = null;
        // d.fy = null;
    }


}

force_layout.prototype.calGraph = function() {

    var self = this;
    var graph = self.initGraphData,
        viewWidth = self.viewWidth,
        viewHeight = self.viewHeight,
        nodeR = self.nodeR,
        collideStrength = self.collideStrength,
        linkNodeMappingType = self.linkNodeMappingType,
        linkDistance = self.linkDistance,
        linkStrength = self.linkStrength,
        nodeStrength = self.nodeStrength;


    self.f_center.x(viewWidth / 2).y(viewHeight / 2);
    self.f_collide.radius(nodeR * 2).strength(collideStrength);
    self.f_link.links(graph.links).id(function(d) {
        //return d[linkNodeMa..appingType] 
        return d.id
    }).distance(function(d) {
        var sourceType = d.source.type
        var targetType = d.source.type
        var sourceDegree = d.source.degree
        var targetDegree = d.target.degree
        var num = Math.min(sourceDegree, targetDegree)
            //console.log(linkDistance)

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
        return 10
    }).strength(linkStrength)

    self.f_manyBody.strength(function(d) {
        //console.log(self.nodeStrength)
        // return nodeStrength
        var charge = nodeStrength
        if (d.type) {
            if (d.type === 'root') {
                if (d.degree < 10) {
                    return charge * 1
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
        return charge * 1
    })

    // console.log(self.f_link)
    // console.log(self.f_manyBody)

    var tag = 0; // 判断是否要重启
    self.f_simulation.force('charge', self.f_manyBody).force('center', self.f_center)
        .force('collide', self.f_collide)
        .force('X', d3.forceX().x(0).strength(0.05))
        .force('Y', d3.forceY().y(0).strength(0.2))

    // console.log(self.f_simulation)
    self.f_simulation.nodes(graph.nodes).force('link', self.f_link).on('tick', tick);

    function tick() {
        //console.log('tick?')
        var extendTimes = self.extendTimes
        var panelSelectcor = self.panelSelectcor;
        var node = d3.select(panelSelectcor).selectAll('.node');
        var link = d3.select(panelSelectcor).selectAll('.link');
        var text = d3.select(panelSelectcor).selectAll('.text');

        var minH = 10000000
        var maxH = -1
        var minW = 10000000
        var maxW = -1
        var viewWidth = self.viewWidth
        var viewHeight = self.viewHeight
            // console.log(self.f_simulation.alpha())
        var simulation = self.f_simulation
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

        text
            .attr("x", function(d) {
                return d.x;
            })
            .attr("y", function(d) {
                return d.y;
            });

        if(tag === 1) {
            console.log('sstop')
            simulation.stop()
            return
        }
        if (simulation.alpha() < 0.01 && tag == 0) {
            //console.log(minW, maxW, minH, maxH)
            //console.log(minW, maxW, viewWidth)
            if (minW < 0 || maxW > viewWidth) {
                console.log('width worng')
                node.attr('cx', function(d) {
                    d.x = (d.x - minW - (maxW - minW) / 2) / (maxW - minW) * (viewWidth) + viewWidth / 2
                    graph.nodes[d.index].x = d.x
                    return d.x
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
                $("#controlPanel").css('display', 'block');
                tag = 1;
            }
            if (minH < 0 || maxH > viewHeight) {
                // console.log("height wrong")
                node
                    .attr('cy', function(d) {
                        d.y = (d.y - minH - (maxH - minH) / 2) / (maxH - minH) * (viewHeight) + viewHeight / 2
                        graph.nodes[d.index].y = d.y
                        return d.y
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
                $("#controlPanel").css('display', 'block');
                tag= 1;
            }

            // 扩展点
            var n_totalW = maxW - minW;
            if (n_totalW < (viewWidth) * extendTimes + 10) {
                node
                    .attr('cx', function(d) {
                        d.x = (d.x - minW - (maxW - minW) / 2) / (maxW - minW) * (viewWidth) * extendTimes + viewHeight / 2
                        graph.nodesData[d.index].x = d.x
                        return d.x
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
                $("#controlPanel").css('display', 'block');
                tag = 1;

            }
            var n_totalH = maxH - minH;
            if (n_totalH < (viewHeight) * extendTimes + 10) {
                node
                    .attr('cy', function(d) {
                        d.y = (d.y - minH - (maxH - minH) / 2) / (maxH - minH) * (viewHeight) * extendTimes + viewHeight / 2
                        graph.nodesData[d.index].y = d.y
                        return d.y
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
                $("#controlPanel").css('display', 'block');
                tag = 1;

            }

        }
        // console.log(simulation.alpha())
        console.log(tag)
        if(tag == 1){
            simulation.alpha(0.2)
            simulation.restart()
        }
        if (simulation.alpha() < 0.01) {
            $("#load").css('display', 'none');
            $("#graph").css('display', 'block');
            $("#controlPanel").css('display', 'block');
            graph.nodes.forEach(function(d) {
                d.fixed = true;
            })
        }

    }
}

force_layout.prototype.updateGraph = function(attr) {
    var self = this;
    console.log(attr)
    d3.select('#rectBorder').remove();
    var nodeSize = self.nodeSize
    if (attr == "nodeSize") {
        d3.selectAll('.node').attr('r', function(d) {
            return nodeSize / 3* Math.pow(d.paperNum, 0.4) + 3 + 'px';
        })
        d3.selectAll('.text').style('font-size', function(d) {
            return nodeSize / 3* Math.pow(d.paperNum, 0.4) + 3 + 'px';
        })
        .attr('dx', function(d){
            return nodeSize / 6 * Math.pow(d.paperNum, 0.4) + 3 + 10;
        })

    }
    if (attr == "linkWidth") {
        d3.selectAll('.link').attr('stroke-width', self.linkWidth)
    }
    self.draw();
    self.calGraph();
    if (self.f_simulation.alpha() < 0.001) {
        self.f_simulation.alpha(0.4);
        self.f_simulation.restart();
    } else {
        self.f_simulation.alpha(0.4);
        self.f_simulation.restart();
    }

}
force_layout.prototype.update = function() {
    var self = this;
    d3.select('#rectBorder').remove();
    self.draw();
    self.calGraph();
    if (self.f_simulation.alpha() < 0.001) {
        self.f_simulation.alpha(0.4);
        self.f_simulation.restart();
    } else {
        self.f_simulation.alpha(0.4);
        self.f_simulation.restart();
    }
}
