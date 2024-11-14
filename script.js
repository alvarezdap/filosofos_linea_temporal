// script.js

// Configuración del gráfico
const width = window.innerWidth - 100;
const height = window.innerHeight - 100;
const margin = { top: 20, right: 20, bottom: 30, left: 50 };

// Crear el elemento SVG
const svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Cargar datos desde un archivo JSON
d3.json("data.json").then(function(data) {
    // Ordenar datos por nacimiento_date en orden ascendente
    data.sort((a, b) => a.nacimiento_date - b.nacimiento_date);

    // Configurar las escalas
    const x = d3.scaleLinear()
        .domain([0, 13500])
        .range([0, width]);

    const y = d3.scaleBand()
        .domain(data.map(d => d.name))
        .range([0, height])
        .padding(0.1);

    // Añadir el eje X
    const xAxis = svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x).tickFormat(d3.format("d")));

    // Crear el tooltip
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    // Añadir las barras
    const bars = svg.selectAll(".dot")
        .data(data)
        .enter().append("rect")
        .attr("class", "dot")
        .attr("name", d => d.name)
        .attr("x", d => x(Math.min(d.nacimiento_date, d.muerte_date)))
        .attr("y", d => y(d.name))
        .attr("width", d => Math.abs(x(d.nacimiento_date) - x(d.muerte_date)))
        .attr("height", y.bandwidth())
        .attr("fill", d => d.persona === "si" ? "red" : "blue")
        .on("click", function(event, d) {
            d3.select(this).attr("fill", "orange");
            tooltip.transition().duration(200).style("opacity", .9);
            tooltip.html(`${d.name}<br/>Nacimiento: ${d.nacimiento_date}<br/>Muerte: ${d.muerte_date}`)
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 28) + "px");
        });

    // Añadir etiquetas
    const labels = svg.selectAll(".label")
        .data(data)
        .enter().append("text")
        .attr("class", "label")
        .attr("x", d => x(Math.max(d.nacimiento_date, d.muerte_date)) + 5)
        .attr("y", d => y(d.name) + y.bandwidth() / 2)
        .text(d => `${d.name}`)
        .attr("fill", "black")
        .attr("font-size", "12px")
        .attr("text-anchor", "start")
        .attr("alignment-baseline", "middle");

    // Crear la línea del mouse
    const mouseLine = svg.append("line")
        .attr("class", "mouse-line")
        .attr("y1", 0)
        .attr("y2", height)
        .style("stroke", "black")
        .style("stroke-width", 1)
        .style("stroke-dasharray", "5,5")
        .style("opacity", 0);

    // Crear el texto del año
    const yearText = svg.append("text")
        .attr("class", "year-text")
        .attr("y", -10) // Posición inicial fuera del SVG
        .attr("fill", "black")
        .attr("font-size", "12px")
        .attr("text-anchor", "middle")
        .style("opacity", 0);

    // Crear área de detección del mouse
    svg.append("rect")
        .attr("width", width)
        .attr("height", height)
        .attr("fill", "none")
        .attr("pointer-events", "all")
        .on("mouseover", () => {
            mouseLine.style("opacity", 1);
            yearText.style("opacity", 1);
            
        })
        .on("mouseout", () => {
            mouseLine.style("opacity", 0);
            yearText.style("opacity", 0);
            labels.style("opacity", 0); // Ocultar todas las etiquetas al salir
        })
        .on("mousemove", function(event) {
            const [mouseX] = d3.pointer(event);
            const year = Math.round(x.invert(mouseX));
            mouseLine.attr("x1", mouseX).attr("x2", mouseX);
            yearText.attr("x", mouseX).attr("y", -10).text(year);

            // Mostrar solo la etiqueta del evento en hover
            const hoveredData = data.find(d => {
                const xStart = x(Math.min(d.nacimiento_date, d.muerte_date));
                const xEnd = x(Math.max(d.nacimiento_date, d.muerte_date));
                return mouseX >= xStart && mouseX <= xEnd;
            });

            labels.style("opacity", 0); // Ocultar todas las etiquetas
            if (hoveredData) {
                svg.selectAll(".label")
                    .filter(d => d.name === hoveredData.name)
                    .style("opacity", 1); // Mostrar solo la etiqueta del evento en hover
            }
        });

    // Añadir zoom y pan
    const zoom = d3.zoom()
        .scaleExtent([1, 10])
        .translateExtent([[0, 0], [width, height]])
        .on("zoom", zoomed);

    svg.call(zoom);

    // Variable para mantener la escala X transformada
    let currentX = x;

    function zoomed(event) {
        const transform = event.transform;
        currentX = transform.rescaleX(x);
        xAxis.call(d3.axisBottom(currentX).tickFormat(d3.format("d")));
        bars.attr("x", d => currentX(Math.min(d.nacimiento_date, d.muerte_date)))
            .attr("width", d => Math.abs(currentX(d.nacimiento_date) - currentX(d.muerte_date)));
        labels.attr("x", d => currentX(Math.max(d.nacimiento_date, d.muerte_date)) + 5);
        
        // Actualizar el comportamiento del mousemove para usar la escala actual
        svg.select("rect")
            .on("mousemove", function(event) {
                const [mouseX] = d3.pointer(event);
                const year = Math.round(currentX.invert(mouseX));
                mouseLine.attr("x1", mouseX).attr("x2", mouseX);
                yearText.attr("x", mouseX).text(year);
            });
    }
});
