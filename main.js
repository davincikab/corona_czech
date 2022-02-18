class MapChart {
    constructor(activeColumn, data) {
        this.activeColumn = activeColumn;
        this.data = data;
        this.currentIndex = 0;
        this.columns = ['kumulativni_pocet_nakazenych', 'kumulativni_pocet_vylecenych', 'kumulativni_pocet_umrti', 'noveNakaz', 'noveVyle', 'aktNak'];

        this.gPaths = d3.selectAll('#okresy_p g');
        this.togglePlay = document.getElementById("toggle-play");

        this.togglePlay.onclick = (e) => this.handlePlayToggle(e);
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
        let dateData = this.data
            .filter(item => item.datum == this.activeDate).filter(item => item.okres_lau_kod)
        
        dateData.forEach(item => {
            this.columns.forEach(col => {
                item[col] = parseFloat(item[col])
            });

            return item;
        })
        
        dateData.sort((a, b) => parseInt(a[this.activeColumn]) - parseInt(b[this.activeColumn]));

        // get min and max;
        let count = dateData.length - 1;
        // dateData[0][this.activeColumn]
        this.domain = [
            0,
            dateData[count][this.activeColumn]
        ];

        console.log(dateData[0][this.activeColumn]);
        console.log(this.domain);
        
        // 
        this.gPaths.each((p, j, g) => {

            let id = g[j].id;
            let data = dateData.find(item => item.okres_lau_kod == id);

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
        // let colorScale = d3.scaleSequential().domain([...this.domain]).interpolator(d3.interpolateReds)
        let colorScale = d3.scaleLinear().domain([...this.domain]).range(['#fa9fb5', '#c51b8a']);
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
            }
        });
    }

    play() {
        this.timeInterVal = setInterval(() => {
            this.currentIndex += 1;

            if(this.currentIndex == this.dates.length) {
                this.currentIndex = 0;
                clearInterval(this.timeInterVal)
            }

            this.activeDate = this.dates[this.currentIndex];
            console.log(this.activeDate);

            this.updateChart();

            // update timeString
            this.updateTimeString();

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
}

const chartInstance = new MapChart('kumulativni_pocet_nakazenych', []);

d3.csv("data.csv")
.then(data => {
    chartInstance.setData(data);
    chartInstance.updateColumnSelect();
    chartInstance.updateChart();


});
