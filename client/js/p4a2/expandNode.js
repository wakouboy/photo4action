var expand_node = function () {
	var self = this;
}
expand_node.prototype.addData = function(node) {
	var self = this;

	console.log("this", node)
	// console.log("links", window.forceLayout.initGraphData.links)
	// console.log("nodes", window.forceLayout.initGraphData.nodes)
	var nodesCurrent = window.forceLayout.initGraphData.nodes;
	var linksCurrent = window.forceLayout.initGraphData.links;
	var nodesGlobal = window.forceLayout.graphData.nodes;
	var linksGlobal = window.forceLayout.graphData.links;
	// 处理点的扩展
	for (var i in node.nodesToExpand) { 
		var nodeId = node.nodesToExpand[i];
		var thisNode = nodesGlobal[nodeId];
        if($.inArray(thisNode, nodesCurrent) == -1) {
            nodesCurrent.push(thisNode); // 把可以扩展的节点加入当前的节点数组
            node.nodesToShrink.push(thisNode); // 并修改当前的nodeToShrink
        }
		
	}
	// 对于得到的新数组，遍历当前的nodes数组，并对其他所有节点进行判断是否需要修改状态
	// 需要修改的状态为，expand和nodesToExpand
	for (var i in nodesCurrent){
		// 直接重新计算nodeToExpand
		nodesCurrent[i].nodeToExpand = [];
		for (var j in nodesCurrent[i].neighbor) { 
            var thisNeighborId = nodesCurrent[i].neighbor[j];
            if ($.inArray(nodesGlobal[thisNeighborId], nodesCurrent) != -1) {
                var thisLinkId = nodesCurrent[i].neighborLinksIndex[thisNeighborId]; // 要增加的这条边的id
                if ($.inArray(linksGlobal[thisLinkId], linksCurrent) == -1) { // 没添加过这条边的时候，添加
                    linksCurrent.push(linksGlobal[thisLinkId])
                }
            } else { // 说明这个邻居不在现在的点集中，即当前节点还能继续扩展
                // ***考虑需要把nodesData中的点也进行修改
                nodesCurrent[i].expand = true
                nodesCurrent[i].nodesToExpand.push(thisNeighborId) // 记录这点可以扩展的邻居节点
            }
        }
	}
	node.expand = false; // 修改该节点的状态为 不可扩展
	node.shrink = true; // 修改该节点的状态为 可以收缩
	node.nodesToExpand = []; // 可以扩展的节点为空
	forceLayout.update()
	console.log(nodesCurrent)
	console.log(linksCurrent)
	
};