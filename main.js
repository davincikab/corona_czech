const popup = d3.select('#popup');
class MapChart {
    constructor(activeColumn, data) {
        this.activeColumn = activeColumn;
        this.data = data;
        this.currentIndex = 0;
        this.columns = ['kumulativni_pocet_nakazenych', 'kumulativni_pocet_vylecenych', 'kumulativni_pocet_umrti', 'noveNakaz', 'noveVyle', 'aktNak'];

        this.gPaths = d3.selectAll('#okresy_p g');
        this.togglePlay = document.getElementById("toggle-play");

        this.togglePlay.onclick = (e) => this.handlePlayToggle(e);

        this.popupInfo();
    }

    handlePlayToggle(e) {
        let { target } = e;

        console.log(target.innerHTML);

        if(target.innerHTML == 'Play') {
            target.innerHTML = 'Pause';
            this.play();
        } else {
            target.innerHTML = 'Play';
            this.pause();
        }
    }

    extractDates() {
        this.dates = [...new Set(this.data.map(item => item.datum ))];
        this.activeDate = this.dates[0];
    }

    // getColumns
    setActiveColumn(columnName) {
        this.activeColumn = columnName;
    }

    setData(data) {
        this.data = data;
    }

    updateColumns() {
        this.columns = this.data.columns.slice(2, 8)  || [];
    }

    updateChart() {
        if(!this.dates) {
            this.extractDates();
        }
        

        // get the current date data;
        this.dateData = this.data
            .filter(item => item.datum == this.activeDate).filter(item => item.okres_lau_kod)
        
        this.dateData.forEach(item => {
            this.columns.forEach(col => {
                item[col] = parseFloat(item[col])
            });

            return item;
        })
        
        this.dateData.sort((a, b) => parseInt(a[this.activeColumn]) - parseInt(b[this.activeColumn]));

        // get min and max;
        let count = this.dateData.length - 1;
        // dateData[0][this.activeColumn]
        this.domain = [
            0,
            this.dateData[count][this.activeColumn]
        ];
        
        // update the colors
        this.gPaths.each((p, j, g) => {

            let id = g[j].id;
            let data = this.dateData.find(item => item.okres_lau_kod == id);

            let path = d3.select(`#${id} path`)
                    .transition()
                    .duration(50)
            if(data) {
                
                path.attr('fill', this.getColor(data[this.activeColumn]))
            } else {
                path.attr('fill', '#ccc')
            }

        })


    }

    // color scheme
    getColor(value) {
        // let colorScale = d3.scaleSequential().domain([...this.domain]).interpolator(d3.interpolateReds)['#fa9fb5', '#c51b8a']
        let colorScale = d3.scaleLinear()
            .domain( [0, 10000, 20000, 50000, 100000, 200000, 400000]) 
            .range(['#edf8fb','#bfd3e6','#9ebcda','#8c96c6','#8c6bb1','#88419d','#6e016b'])

        return colorScale(value)
    }

    updateColumnSelect() {
        console.log("Select");

        this.columnSelect = document.getElementById("select-column");
        this.columnSelect.innerHTML = this.columns.map(col => `<option value='${col}'>${col.split("_").join(" ")}</option>`).join("");
        this.fireEventListener();
    }

    fireEventListener() {
        this.columnSelect.addEventListener("change", (e) => {
            let { target : { value } } = e;


            this.setActiveColumn(value);
            this.updateChart();

            if(this.timeInterVal) {
                clearInterval(this.timeInterVal);
                this.currentIndex = 0;

                this.activeDate = this.dates[this.currentIndex];
                this.updateTimeString();
                this.togglePlay.click();
            }
        });
    }

    play() {
        this.timeInterVal = setInterval(() => {
            this.currentIndex += 3;

            if(this.currentIndex >= this.dates.length) {
                this.currentIndex = 0;
                clearInterval(this.timeInterVal)
            }

            this.activeDate = this.dates[this.currentIndex];
            console.log(this.activeDate);

            this.updateChart();

            // update timeString
            this.updateTimeString();

            // clear current legend
            // legendChart(this.domain);

        }, 500);
    }

    pause() {
        clearInterval(this.timeInterVal)
    }

    updateTimeString() {
        let dateDiv = document.getElementById("active-date");
        let date = new Date(this.activeDate);

        dateDiv.innerHTML = `${date.getFullYear()}-${this.zeroPad(date.getMonth() + 1)}-${this.zeroPad(date.getDate())}`
    }

    zeroPad(value) {
        return `${value}`.length < 2 ? `0${value}` : value;
    }

    updateLegend() {

    }

    // popup
    popupInfo() {
        this.gPaths.each((p, i, g) => {
            let node = g[i];

            d3.select(node).on('mouseover', (e) => {
                // console.log("Mouse Over");

                // let id = g[i].id;
                // let data = this.dateData.find(item => item.okres_lau_kod == id);

                // popup.transition()
                //     .duration(500)
                //     .style("opacity", .9);

                // popup.html(`
                //     <div class='popup-item'><b>Nom</b>${data.okres_lau_kod}</div>
                //     <div class='popup-item'><b>Value</b>${data[this.activeColumn]}</div>
                // `)
                // .style("left", (e.pageX) + "px")
                // .style("top", (e.pageY - 30) + "px");
            })
            .on('mouseout', e => {
                // console.log('Mouse Out');
            });

            // console.log(node);
        });
    }   
}

const chartInstance = new MapChart('kumulativni_pocet_nakazenych', []);

d3.csv("data.csv")
.then(data => {
    chartInstance.setData(data);
    chartInstance.updateColumnSelect();
    chartInstance.updateChart();


    legendChart();
});

function legendChart() {    
    let legendSvg = d3.select("#legend-svg")
        .attr('width', 250)
        .attr('height', 50)
    
    // clear current legend
    legendSvg.selectAll('*').remove();

    console.log("updating legend");

    var gradient = legendSvg.append('defs')
        .append('linearGradient')
        .attr('id', 'gradient')
        .attr('x1', '0%') // bottom
        .attr('y1', '0%')

        .attr('x2', '100%') // to top
        .attr('y2', '0%')
        .attr('spreadMethod', 'pad');
    
    // add stops
    let pcts = [0, 500, 1000, 1500, 2000, 2500, 3000, 3500, 4000].map(val => val*100 / 4000);
    console.log(pcts);

    var colourPct  = d3.zip(
        pcts, 
        ['#edf8fb','#bfd3e6','#9ebcda','#8c96c6','#8c6bb1','#88419d','#6e016b']
    );

    console.log(colourPct)

    colourPct.forEach(d => {
        gradient.append('stop')
                .attr('offset', `${d[0]}%`)
                .attr('stop-color', d[1])
                .attr('stop-opacity', 1);
    });

    legendSvg.append('rect')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('width', 230)
        .attr('height', 30)
        .style('fill', 'url(#gradient)');

    
     // create a scale and axis for the legend
     var legendScale = d3.scaleLinear()
        .domain([0, 4000])
        .range([0, 220]);

    var legendAxis = d3.axisBottom()
        .scale(legendScale)
        .ticks(4)
        // .tickValues([0, 100, 200, 500, 1000, 2000, 4000])
        .tickFormat(d3.format("d"));

    legendSvg.append("g")
        .attr("class", "legend axis")
        .attr("transform", "translate(4, 30)")
        .call(legendAxis);
}
