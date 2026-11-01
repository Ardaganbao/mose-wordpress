var iddd= 0;
 
(function ($) {
    var dynamicColors = function() {
        var r = Math.floor(Math.random() * 255);
        var g = Math.floor(Math.random() * 255);
        var b = Math.floor(Math.random() * 255);
        return "rgb(" + r + "," + g + "," + b + ")";
    };

    /*
    const drawCloud = (c, x, y) => {
        c.beginPath();
        c.arc(x, y, 15, Math.PI * 0.5, Math.PI * 1.4);
        c.arc(x + 15, y - 29, 22, Math.PI * 78, Math.PI * 1.85);
        c.arc(x + 50, y - 35, 15, Math.PI * 1.05, Math.PI * 2);
        c.arc(x + 65, y - 5, 30, Math.PI * 1.5, Math.PI * 2.24);
        c.moveTo(x + 87, y + 15);
        c.lineTo(x, y + 15);
        c.strokeStyle = '#797874';
        c.stroke();
        c.fillStyle = '#8ED6FF';
        c.fill()
    }


    $.fn.processArdagram 	= function(thing ) { 
        var  data = JSON.parse($(thing).html());
        var entities = [] ;
        var entityID= 0;
        for (const property in data) {
            for (const p1 in data[property]) {
                console.log(`${property}.${data[property][p1].name}`);
                var obj = {};
                obj.obj  = data[property][p1];
                obj.is = property +"."+ data[property][p1].name;
                entities[entityID++]=obj;
            }	
          
        }
        
        
        $( thing ).html("");  
         
        var canvas = document.createElement('canvas');
        canvas.id = "my-Ardagram_" + iddd; 
        iddd++; 
        
        canvas.setAttribute("width", 700);
        canvas.setAttribute("height", 400);
         
        var ctx = canvas.getContext("2d");
        var fontsize = 14;
        var fontface = 'Arial';
        var lineHeight = fontsize * 1.286;		
        var margin  = 20 ; 
        var padding = 20 ;
        
        if (typeof data.Networks !== 'undefined') {
            var networks = data.Networks ; 
            var previous=padding;  
            networks.forEach(function(network, index, arr) {
                     
                if(index>0){
                    previous =  previous +margin+ networks[index-1].draw.textWidth;
                    
                }
                   
        
                var text = network.name;

                ctx.font = fontsize + 'px ' + fontface; 
                network.draw ={};
                network.draw.textWidth  = ctx.measureText(text).width+padding*2;
                network.draw.textx  = previous+margin;
                network.draw.texty  =  53;
                network.draw.boxx1  = previous-padding+margin;
                network.draw.boxy1  = 50;
                network.draw.boxx2  = network.draw.textWidth ;
                network.draw.boxy2  = lineHeight;

                ctx.textAlign = 'left';
                ctx.textBaseline = 'top';

                
                 
                if (typeof network.type !== 'undefined'&&network.type=="public") {
                    drawCloud(ctx, network.draw.boxx1,network.draw.boxx2);
                    network.draw.textx=network.draw.textx  +0
                    network.draw.texty=network.draw.texty  +20 
                }else{	
                    ctx.strokeRect(network.draw.boxx1,network.draw.boxy1,network.draw.boxx2 , network.draw.boxy2);						
                }
                ctx.strokeStyle = '#000000';
                ctx.fillStyle = '#000000';
                ctx.fillText(text, network.draw.textx,network.draw.texty);
                     
            });

          
        }
        

         
        

            
        //thing. appendChild (canvas) ; hude for now the image
     
    };
*/
    $.fn.processPlotly	= function(thing , type) {  
        var text = $(thing).html();
        var row = text.split("\n");  
        
        
        var headerRow =[];
        var dataRows =[];
        var datarowsIndex = 0;
        var previousRow =[];
        
        
        row.forEach(processRows);


        function processRows(item, index, arr) {
            var txt = document.createElement("textarea");
            txt.innerHTML = item;
            var splitItem = txt.value.split("|"); 
            splitItem = splitItem.slice(1, splitItem.length - 1);
            splitItem.forEach(function(toclean, tocleanindex, tocleanarr) {
                tocleanarr[tocleanindex]=toclean.trim();
            });
            if(headerRow.length>0){
                if(splitItem.length>0){
                    dataRows[datarowsIndex]  = splitItem; 
                    datarowsIndex++;
                }
                return;
            }
            if(index==1){
                headerRow = previousRow;
                return;
            } 
            previousRow = splitItem; 
        }
          
        
        var color = ["#3e95cd", "#8e5ea2","#3cba9f","#e8c3b9","#c45850"];
        var colorCommvault = ["#04c147", "#ff9800","#f1453d","#777777","#e4c9a3"];
        var colorWarning = ['#04c147', '#ff9800', '#f1453d', ];
        var colorVol = ['#04c147', '#f1453d','#ffc961',"#ec9006" ];

        var  options = {				
            title: {
                display: true,
                text: 'Chart.js Bar Chart - Stacked'
            },
            plugins: {
                
            },
            responsive: false,	
            
            scales: {
                    yAxes: { 
                },
                /*xAxes: [
                    {
                        stacked: true,
                        ticks: { maxRotation: 90, minRotation: 90 }
                    }
                ]*/
            },
            animation: {
                duration: 0
            },
            devicePixelRatio: 700,
        };		

            
        var data_chartjs =  {
                datasets: [{
                    label: "Long",
                    backgroundColor: color[0],
                    data: [30, 40],
                },
                {
                    label: "other",
                    backgroundColor: color[1],
                    data: [20, 10],
                }],
                labels: ['a', 'b']
            }
        var config_chartjs =   { 
            type: 'bar',
            data: data_chartjs,
            devicePixelRatio: 10,
            options: options
        };
        if(type=="warningPie"||type=="NasVolume"){ 
            options.title.text =   headerRow.shift(); 
            dataRows[0].shift();
            data_chartjs.labels = headerRow ; 
            config_chartjs.type	= 'pie';	 
            
            if(type=="warningPie"){
                data_chartjs.datasets =[{ 
                    data: dataRows[0],
                    label: "",
                    backgroundColor: colorWarning ,
                }];	
                 
            }else {
                 
                var dataRow = dataRows[0]; 
                var colorFree = [];
                var sum = 0;
                dataRow.forEach(function(dataRowValue, indexdataRow, arrdataRow) {
                     
                        sum = sum + Number(dataRowValue) ; 
                     
                });
                dataRow.forEach(function(dataRowValue, indexdataRow, arrdataRow) {
                        var percent = dataRowValue/sum*100;
                        colorFree[indexdataRow] = colorVol[indexdataRow];
                        if(indexdataRow==0){								
                            if (percent < 25) {
                                colorFree[0] = colorVol[2];
                            } 
                            if (percent < 15) {
                                colorFree[0] = colorVol[3];
                            }
                        }  
                     
                });
                data_chartjs.datasets=[{ 
                    data: dataRow,
                    label: "",  
                    backgroundColor: colorFree,
                }];
            }
        }  
        else if(type=="Multiline" || type=="StorageEvolution"){ 
        
            options.title.text =   headerRow.shift(); 
            if(  type=="StorageEvolution"){
                    var disk =    headerRow.shift();   
                }
            data_chartjs.labels = headerRow ; 
            config_chartjs.type	= 'line';			
            
            dataRows.forEach(function(row, index, arr) {
                var iname =   row.shift(); 
                var disk = "";
                if(  type=="StorageEvolution"){
                    var disk =   row.shift(); 
                }
                data_chartjs.datasets[index]={ 
                    data: row,
                    label: iname + " " + disk,  
                    borderColor: dynamicColors(),
                    fill: false,
                };	
            });

             
        }
        else{
            if(dataRows.length>1){ 
                options.title.text =   headerRow.shift(); 
                data_chartjs.labels = headerRow ; 
                var selectedColor;
                if(type=="CommVaultJob"){
                    selectedColor = colorCommvault;
                }else if(type=="Volbarstacked"){
                    selectedColor = colorVol;
                }else{
                    selectedColor = color;
                }
                dataRows.forEach(function(row, index, arr) {
                    var iname =   row.shift(); 
                    data_chartjs.datasets[index]={ 
                        data: row,
                        label: iname,  
                        backgroundColor: selectedColor[index],
                    };	
                });
                
                if(type=="Volbarstacked" || type=="CommVaultJob" || type=="barstacked")	{  
                    options.scales =   {
                        yAxes: [{ stacked: true }],
                        xAxes: [
                            {
                                stacked: true,
                                ticks: { maxRotation: 90, minRotation: 90 }
                            }
                        ]
                         
                    };	
                }
            

             
            }
            else{
                if(type=="Volbarstacked"){
                    options.title.text =   headerRow.shift(); 
                    data_chartjs.labels = headerRow ; 
                    var selectedColor = colorVol;
                    
                    dataRows.forEach(function(row, index, arr) {
                        var iname =   row.shift(); 
                        var free = row;
                        var used =[];
                        var colorFree = [];
                        free.forEach(function(datafree, indexfree, arrfree) {
                            if (datafree>=0 && datafree<=100) {
                                used[indexfree]=100-datafree;	
                                colorFree[indexfree] = colorVol[0];
                                if (datafree < 25) {
                                    colorFree[indexfree] = colorVol[2];
                                } 
                                if (datafree < 15) {
                                    colorFree[indexfree] = colorVol[3];
                                } 
                                    
                            }
                        });
                        data_chartjs.datasets[1]={ 
                            data: free,
                            label: "Free",  
                            backgroundColor: colorFree,
                        };
                        data_chartjs.datasets[0]={ 
                            data: used,
                            label: "Used",  
                            backgroundColor: selectedColor[1],
                        };							
                    });
                    options.scales =   {
                        yAxes: [{ stacked: true }],
                        xAxes: [
                            {
                                stacked: true,
                                ticks: { maxRotation: 90, minRotation: 90 }
                            }
                        ]
                         
                    };	
                    
                }   
                else {
                    data_chartjs.labels = headerRow ; 
                             
                    /*var arrOfNum = [];

                    dataRows[0].forEach(str => {
                      arrOfNum.push(Number(str));
                    });
                     */
                    data_chartjs.datasets =[{ 
                        data: dataRows[0],
                        label: "",
                        backgroundColor: color[0],
                    }];	
                }	 
            }
        }
        
         
        $( thing ).html("");  
         
        var canvas = document.createElement('canvas');
        canvas.id = "my-Chartjs_" + iddd;
        iddd++; 
        if(type=="CommVaultJob" || type=="Volbarstacked"){
            canvas.setAttribute("width", 650);
            canvas.setAttribute("height", 400);
        }else{
            canvas.setAttribute("width", 650);
            canvas.setAttribute("height", 300);
        }

        thing. appendChild (canvas) ; 
     
         
        var ctx = canvas.getContext("2d"); 
        var chart = new Chart(ctx, config_chartjs); 
                 
         
    };
}(jQuery));