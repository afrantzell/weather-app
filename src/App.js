import React, { Component } from 'react';
import './App.css';
import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSun as sun,
    faMoon as moon,
    faCloud as cloud,
    faCloudRain as rain,
    faSnowflake as snow,
    faWind as wind,
    faCloudSun as partlyCloudyDay,
    faCloudMoon as partlyCloudyNight
} from '@fortawesome/free-solid-svg-icons'
var momentTZ = require('moment-timezone')
momentTZ().tz("America/Los-Angeles").format();
var moment = require('moment')
moment().format();


//component for hourly forecast
class Hourly extends Component{

render(){

let tern = this.props.tern   

//First, convert the hourly forecast object into an array-like object with Object.entries
//Second, map over the object to return 6 forecasts at 2-hour intervals
//Third, use moments.js to convert the UNIX timestamps for each forecast into hh format, adjusted to the user's timezone
let forecastHours = Object.entries(this.props.object.hourly.data).map(function(el, index){
    if(index%2===0 && index<12){
        let icon = el[1].icon
        let date = moment.unix(el[1].time)
        let timeZ = Intl.DateTimeFormat().resolvedOptions().timeZone
        date = date.tz(timeZ).format('hA')

        //use tern function created upstream in WeatherData component
        //to determine which icon is displayed for each hour
        return (<div>  
                    <p>{date}</p>
                    <p><FontAwesomeIcon icon = {tern(icon)}/></p>
                    <p>{Math.round(el[1].temperature)}°F</p>
                </div>) 
                }
        }) 

return (
    <div class = "container">  
    {forecastHours}
    </div>
)

} }


//component for error handling
class Error extends Component{
    render(){
        return(
            <div>
                <br />
                <i>Location not found.</i>
            </div>
        )
    }
}

//component to return all weather data
class WeatherData extends Component{
    
    render(){
        //if the sun icon is displayed, color it yellow
        //all other icons remain white
        var iconColor
        if (this.props.object.currently.icon === "clear-day"){
            iconColor = "yellow"
            }
        else{iconColor = "white"}

        var icon = this.props.object.currently.icon    
        
        //reusable function for determining which fontawesome icon to display
        var tern = function(icono){
            if(icono === "clear-day"){ return sun}
            else if(icono === "clear-night"){ return moon}
            else if(icono === "rain"){return rain}
            else if(icono === "snow" || icono === "sleet"){ return snow}
            else if (icono === "wind"){return wind}
            else if (icono === "cloudy" || icono === "fog"){return cloud}
            else if (icono === "partly-cloudy-day"){return partlyCloudyDay}
            else if (icono === "partly-cloudy-night"){return partlyCloudyNight}}

        return(            
            <div>    
            <p class = "med">{this.props.summary}</p>
            <p><FontAwesomeIcon icon = {tern(icon)} 
                                        size="5x"
                                        color = {iconColor}/></p>
            <p class = "huge">{Math.round(this.props.object.currently.temperature)}°F</p>
            <p class = "highLow">H: {Math.round(this.props.object.daily.data[0].temperatureHigh)}°F
                             L: {Math.round(this.props.object.daily.data[0].temperatureLow)}°F</p>
            <Hourly object = {this.props.object}
                    tern = {tern}/>
            </div>
        )
    }
}

//component that selects error handler or weather data components based on geocoding API quality score
class Results extends Component{   
    render(){

        //return nothing if no location given
        if(this.props.summary === ""){
            return null
        }

        //returns error if low MapQuest geocoding API quality score
        if(this.props.quality.substring(2) === "XXX"){
            return <Error />
        }

        //otherwise, return weather data component
        return <div><WeatherData 
                summary = {this.props.summary}
                object = {this.props.object}
                /></div>
    }
}

//component for user to input placename
const SearchBar = props => (
    <form onSubmit = {props.doIt}>      
        <input 
            type="text" 
            name = "entry" 
            placeholder="City, State" 
        />
        <button>Submit</button>  
        </form>
)

//main application
class App extends Component{
    constructor(props){
        super(props);
        this.state = {
            lat: "",
            lon: "",
            quality: "",
            summary: "",
            object: {}
        }
      
    this.doIt = this.doIt.bind(this);
    this.weather = this.weather.bind(this);       
    }
    
//weather component calls the DarkSky API
//the DarkSky API uses the latitude and longitude output from the MapQuest geocoding API as input to find weather
//proxy is used to bypass CORS protection of DarkSky API    
weather(){
    const proxy = 'https://cors-anywhere.herokuapp.com/'
    const darkAPI = `https://api.darksky.net/forecast/${process.env.REACT_APP_API_KEY}/${this.state.lat},${this.state.lon}`

    fetch(proxy + darkAPI)
    .then(response => response.json())
    .then(data => this.setState({summary: data.currently.summary,
                                object: data
                                },  function(){console.log("darksky API: " + this.state.lat + " " + this.state.lon)}))
}
                            
doIt(e){
    e.preventDefault()
    const location = e.target.elements.entry.value
    const mapAPI = `http://open.mapquestapi.com/geocoding/v1/address?key=${process.env.REACT_APP_MAPQUEST_KEY}&location=${location}`
    
  //error handler for no value given
  if (location.length === 0){
      return null
  }
    
  //MapQuest geocoding API takes placename as user input and finds latitude and longitude   
    fetch(mapAPI)
        .then(response => response.json())
        .then(data=> this.setState({ lat: data.results[0].locations[0].latLng.lat, 
                                   lon: data.results[0].locations[0].latLng.lng,
                                    quality: data.results[0].locations[0].geocodeQualityCode
                                   }, function(){console.log("mapquest API: quality:" + this.state.quality + ", " + this.state.location + ", " + this.state.lat + " " + this.state.lon)}))
    
}

//React lifecycle component used to call DarkSky API only after state is set with new latitude
componentDidUpdate(prevProps, prevState){
    if (this.state.lat !== prevState.lat) {
      this.weather()
    }
  }
    
  render(){
      
      return(
      <div>
          <br />
        
        <SearchBar 
          doIt = {this.doIt}/>
          
        <Results
            quality = {this.state.quality}
            summary = {this.state.summary}
            object = {this.state.object}
            />
        </div>
          )
  
}
          
          }

export default App;
