import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from '!mapbox-gl'; // eslint-disable-line import/no-webpack-loader-syntax
// import dataJawaTimur from './dataJson/dataJawaTimur.json'
// import dataJatim from './dataJson/jawa-timur.geojson'
import dataKabupaten from './dataJson/kabupaten.geojson' 
import dataDownload from './dataJson/data-download.json'
mapboxgl.accessToken = 'pk.eyJ1Ijoia2FzaGlraTIyNTEyMSIsImEiOiJja3QzcThmMTUwa2J3MzJudDdnaDVpeG5mIn0.MiGBhPWKUsgW4Y7gbw4pQA';

function getDataColor(){
  let data = [];
  data.push('match');
  data.push(['get','KABUPATEN']);
  dataDownload.map((e) => {
    data.push(e.location);
    if(e.avg_download_throughput > 15000){
      data.push('#B71C1C');
    }else if(e.avg_download_throughput > 10000 && e.avg_download_throughput <= 15000){
      data.push('#EF5350');
    }else if(e.avg_download_throughput > 0 && e.avg_download_throughput <= 10000){
      data.push('#FFEBEE');
    }else{
      data.push('yellow');
    }
    return true;
  })
  data.push('white');  
  return data;
}

export default function App() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [lng, setLng] = useState(112.616);
  const [lat, setLat] = useState(-7.88129);
  const [zoom, setZoom] = useState(7.65);
  const layers = [
    '0 - 5,000',
    '5,000 - 10,000',
    '10,000 - 15,000',
    '15,000+',
    'Null',
    'Data kota tidak ada'
  ];

  const colors = [
      '#FFEBEE',
      '#FFCDD2',
      '#EF5350',
      '#B71C1C',
      'yellow',
      'white'
  ];
  
  useEffect(() => {
    if (map.current) return; // initialize map only once
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [lng, lat],
      zoom: zoom
    });
  });
  
  useEffect(() => {
    if (!map.current) return; // wait for map to initialize
    map.current.on('move', () => {
      setLng(map.current.getCenter().lng.toFixed(4));
      setLat(map.current.getCenter().lat.toFixed(4));
      setZoom(map.current.getZoom().toFixed(2));
    });
  });
  
  useEffect(() => {
    if (!map.current) return; // wait for map to initialize
    map.current.on('load', () => {
      // Add a data source containing GeoJSON data.
      map.current.addSource('kabupaten', {
        'type': 'geojson',
        'data': dataKabupaten
      });
      
      // Add a new layer to visualize the polygon.
      map.current.addLayer({
        'id': 'kabupaten',
        'type': 'fill',
        'source': 'kabupaten', // reference the data source
        'layout': {},
        'paint': {
          'fill-color': getDataColor(),
          'fill-opacity': 1
        }
      },'waterway-label');

      map.current.addLayer({
        'id': 'state-borders',
        'type': 'line',
        'source': 'kabupaten',
        'layout': {},
        'paint': {
          'line-color': '#000',
          'line-width': 0.1
        }
      },'waterway-label');
      
      // Create a popup, but don't add it to the map yet.
      const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        maxWidth: '900px'
      });
      
      map.current.on('mousemove', 'kabupaten', (e) => {
        map.current.getCanvas().style.cursor = 'pointer';
        const kabupaten = e.features[0].properties.KABUPATEN
        const data = dataDownload.filter(item => item.location === kabupaten);
        let avg = data[0] != null ? data[0].avg_download_throughput : null;
        const description = 
          data[0] != null 
          ? 
          `
            <div>
              <p>Reg. <b>${data[0].region}</b></p>
              <h1>${data[0].location}</h1>
            </div>
            <p><em><strong>${ avg != null ? `<i>${(avg.toLocaleString(undefined,{maximumFractionDigits: 2}))} </i> Downloads` : 'Data download tidak ada'}</strong></em></p>
          `
          :
          `<div><h1>Data Kota Tidak ada</h1></div>`;
        
        popup.setLngLat(e.lngLat).setHTML(description).addTo(map.current);
      });
      
      map.current.on('mouseleave', 'kabupaten', () => {
        map.current.getCanvas().style.cursor = '';
        popup.remove();
      });

      // create legend
      const legend = document.getElementById('legend');

      layers.forEach((layer, i) => {
          const color = colors[i];
          const item = document.createElement('div');
          const key = document.createElement('span');
          key.className = 'legend-key';
          key.style.backgroundColor = color;
          key.style.border = '1px black solid'

          const value = document.createElement('span');
          value.innerHTML = `${layer}`;
          item.appendChild(key);
          item.appendChild(value);
          legend.appendChild(item);
      });
      
    });
  });
  
  return (
    <div>
    <div className="sidebar">
    Longitude: {lng} | Latitude: {lat} | Zoom: {zoom}
    </div>
    <div ref={mapContainer} className="map-container" />
    <div className='map-overlay' id='legend'></div>
    </div>
    );
  }