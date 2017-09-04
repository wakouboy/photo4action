var graphLayout, fileUpload;
//min--arr[0], max--arr[1], value--arr[2]

var forceStrength = [0.00, 100, 50];
var forceDistance = [10.00, 80.00, 30];
var forceCharge = [-1000, 0, -50];

var sliderBarConfig = {
    'distance': {
        'barSelector': '#distanceBar',
        'valSelector': '#distanceValue',
        'range': [0, 400, 20],
        'ratio': 1,
        'save': 'linkDistance'
    },
    'linkStrength': {
        'barSelector': '#linkStrengthBar',
        'valSelector': '#linkStrengthValue',
        'range': [0, 100, 0.7],
        'ratio': 100,
        'save': 'linkStrength'
    },
    'nodeStrength': {
        'barSelector': '#nodeStrengthBar',
        'valSelector': '#nodeStrengthValue',
        'range': [-1000, 100, -200],
        'ratio': 1,
        'save': 'nodeStrength'
    },
    'collideStrength': {
        'barSelector': '#collideStrengthBar',
        'valSelector': '#collideStrengthValue',
        'range': [0, 100, 0.7],
        'ratio': 100,
        'save': 'collideStrength'
    },
    'nodeSize' : {
        'barSelector': '#nodeSizeBar',
        'valSelector': '#nodeSizeValue',
        'range': [1, 200, 4],
        'ratio': 10,
        'save': 'nodeSize'
    },
    'linkWidth' : {
        'barSelector': '#linkWidthBar',
        'valSelector': '#linkWidthValue',
        'range': [0, 50, 1],
        'ratio': 10,
        'save': 'linkWidth'
    }
}

$(document).ready(function() {
    //force_layout.init()
    var forceLayout = new force_layout("#graph");
    // fileUpload = new file_upload("loadingDataButton");
    window.forceLayout = forceLayout
     // $( "#controlPanel" ).resizable();
    d3.json('data/nodes527links1705.json', function(error, graph) {
        if (error) throw error;

        forceLayout.setData(graph);

    });
    setBar();
    menuClick();
    graphLayoutClick();
    // iconEvent();
    controlPanelTitleEvent();
    window.messageHandler = new message_handler();
    window.expandNodeWeb = new expand_node();

})

function setBar() {
    var barKeys = Object.keys(sliderBarConfig);
    barKeys.forEach(function(d_key, i_key) {
        var config = sliderBarConfig[d_key];
        var ratio = config['ratio'],
            range = config['range'],
            barSelector = config['barSelector'],
            valSelector = config['valSelector'],
            save = config['save'];
        $(valSelector).html(range[2]);
        $(barSelector).slider({
            min: range[0],
            max: range[1],
            value: range[2] * ratio,
            slide: function(event, ui) {
                var val = ui.value / ratio;
                $(valSelector).html(val);
                forceLayout[save] = val;
                window.forceLayout.updateGraph(save);
                console.log(save + ':  ', val);
            }
        })
    });
}

//menu button event
function menuClick() {
    var $menu = $('#menu');
    var $controlPanel = $('#controlPanel');
    var $graphLayout = $('#graphLayout');
    var $title = $('#controlPanelTitle');
    var $datasetPanel = $('#controlPanel #dataset');
    var $parameterPanel = $('#controlPanel #setParameter');
    var $iconPanel = $('#controlPanel #iconTool');

    $menu.click(function() {
        if ($menu.hasClass('selected')) {
            //close the control panel
            $graphLayout.removeClass('menu-show');
            $graphLayout.addClass('menu-unshow');
            $controlPanel.hide();
            $menu.removeClass('selected');
        } else {
            //show the contol panel
            $graphLayout.removeClass('menu-unshow');
            $graphLayout.addClass('menu-show');
            $controlPanel.show();
            $menu.addClass('selected');

            if ($title.hasClass('selectToHide')) {
                $title.removeClass('selectToHide');
                $datasetPanel.show();
                $parameterPanel.show();
                $iconPanel.show();
            }
        }
    })
}

//graph layout button event
function graphLayoutClick() {
    var $graphLayoutButton = $('#graphLayoutControl');
    var $graphLayout = $('#graphLayout');

    $graphLayoutButton.click(function() {
        if ($graphLayoutButton.hasClass('selected')) {
            $graphLayoutButton.removeClass('selected');
            $graphLayout.hide();
        } else {
            $graphLayoutButton.addClass('selected');
            $graphLayout.show();
        }
    })
}

//icon function
function iconEvent() {
    var $label = $('#label_show');
    var $nodeFixed = $('#node_fixed');
    var $color = $('#color_show');

    //label event
    $label.click(function() {
        if ($label.hasClass('selected')) {
            $label.removeClass('selected');
            $label.select('i').attr('style', 'color:black');
            //do something
            graphLayout.isShowLabel(false);
        } else {
            $label.addClass('selected');
            $label.select('i').attr('style', 'color:#FF9C02');
            //do something
            graphLayout.isShowLabel(true);
        }
    });

    $label.hover(function() {
        if ($label.hasClass('selected')) {
            $label.attr('title', 'remove label');
        } else {
            $label.attr('title', 'show label');
        }
    });

    //nodeFixed event
    $nodeFixed.click(function() {
        if ($nodeFixed.hasClass('selected')) {
            $nodeFixed.removeClass('selected');
            $nodeFixed.select('i').attr('style', 'color:black');
            //do something
            graphLayout.setFixed(false);
        } else {
            $nodeFixed.addClass('selected');
            $nodeFixed.select('i').attr('style', 'color:#FF9C02');
            //do something
            graphLayout.setFixed(true);
        }
    });

    $nodeFixed.hover(function() {
        if ($nodeFixed.hasClass('selected')) {
            $nodeFixed.attr('title', 'remove fixed');
        } else {
            $nodeFixed.attr('title', 'set node to fix');
        }
    })

    //color show or not event
    $color.click(function() {
        if ($color.hasClass('selected')) {
            $color.removeClass('selected');
            $color.select('i').attr('style', 'color:black');
            //do something
            graphLayout.isShowColor(false);
        } else {
            $color.addClass('selected');
            $color.select('i').attr('style', 'color:#FF9C02');
            //do something
            graphLayout.isShowColor(true);
        }
    });

    $color.hover(function() {
        if ($color.hasClass('selected')) {
            $color.attr('title', 'remove color');
        } else {
            $color.attr('title', 'show color');
        }
    });
}

//control panel event
function controlPanelTitleEvent() {
    var $title = $('#controlPanelTitle');
    var $datasetPanel = $('#controlPanel #dataset');
    var $parameterPanel = $('#controlPanel #setParameter');
    var $iconPanel = $('#controlPanel #iconTool');
   
    $title.click(function() {
        if ($title.hasClass('selectToHide')) {
            $title.removeClass('selectToHide');
            $datasetPanel.show();
            $parameterPanel.show();
            $iconPanel.show();
        } else {
            $title.addClass('selectToHide');
            $datasetPanel.hide();
            $parameterPanel.hide();
            $iconPanel.hide();
        }
    })
}
