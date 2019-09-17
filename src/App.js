import React, { Component } from 'react';
import './App.css';
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
import momentTZ from 'moment-timezone'
import moment from 'moment'

momentTZ().tz("America/Los-Angeles").format();
moment().format();

//component for hourly forecast
const Hourly = ({tern, hourlyData}) => {
  
    //Convert the hourly forecast object into an array-like object with Object.entries
    //Filter object for 6 forecasts at 2-hour intervals, then map over it
    //Use moments.js to convert the UNIX timestamps for each forecast into hh format, adjusted to the user's timezone
    const forecastHours = Object.entries(hourlyData).filter((el, index)=>{
        return !(index%2) && index<12
    }).map((el, index) => {
            const icon = el[1].icon
            const timeZ = Intl.DateTimeFormat().resolvedOptions().timeZone
            const date = moment.unix(el[1].time).tz(timeZ).format('hA')
    
            //use tern function created upstream in WeatherData component
            //to determine which icon is displayed for each hour
            return (
            <div>  
                <p>{date}</p>
                <p><FontAwesomeIcon icon = {tern(icon)}/></p>
                <p>{Math.round(el[1].temperature)}°F</p>
            </div>
            );
    }) 

    return (
        <div class = "container">  
        {forecastHours}
        </div>
    )

}

//component for error handling
const Error = () => (
            <div>
                <br />
                <i>Location not found.</i>
            </div>
)

//component to return all weather data
const WeatherData = ({forecast, summary}) => {
        //if the sun icon is displayed, color it yellow
        //all other icons remain white
        let iconColor = "white"
        if(forecast.currently.icon === "clear-day"){
            iconColor = "yellow"
        }

        const icon = forecast.currently.icon    
        
        //determine which fontawesome icon to display
        const tern = (icono) => {
            if(icono === "clear-day"){ return sun}
            if(icono === "clear-night"){ return moon}
            if(icono === "rain"){return rain}
            if(icono === "snow" || icono === "sleet"){ return snow}
            if(icono === "wind"){return wind}
            if(icono === "cloudy" || icono === "fog"){return cloud}
            if(icono === "partly-cloudy-day"){return partlyCloudyDay}
            if(icono === "partly-cloudy-night"){return partlyCloudyNight}
        }

        return(            
            <div>    
            <p class = "med">{summary}</p>
            <p><FontAwesomeIcon icon = {tern(icon)} 
                                        size="5x"
                                        color = {iconColor}/></p>
            <p class = "huge">{Math.round(forecast.currently.temperature)}°F</p>
            <p class = "highLow">H: {Math.round(forecast.daily.data[0].temperatureHigh)}°F
                             L: {Math.round(forecast.daily.data[0].temperatureLow)}°F</p>
            <Hourly hourlyData = {forecast.hourly.data}
                    tern = {tern}/>
            </div>
        )
}


//component that selects error handler or weather data components based on geocoding API quality score
const Results = ({summary, forecast, quality}) => {   

    //return nothing if no location given
    if(summary === ""){
        return null
    }

    //returns error if low MapQuest geocoding API quality score
    if(quality.substring(2) === "XXX"){
        return <Error />
    }

    //otherwise, return weather data component
    return <div><WeatherData 
            summary = {summary}
            forecast = {forecast}
            />
            </div>
    
}

//component for user to input placename
const SearchBar = ({userInput}) => (
    <form onSubmit = {userInput}>      
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
            forecast: {}
        }
      
    this.userInput = this.userInput.bind(this);
    }
    
//weather component calls the DarkSky API
//the DarkSky API uses the latitude and longitude output from the MapQuest geocoding API as input to find weather
//proxy is used to bypass CORS protection of DarkSky API    
                            
    userInput(e){
        e.preventDefault()
        const location = e.target.elements.entry.value
        
        //error handler for no value given
        if (location.length === 0){
            return null
        }
    
        const mapAPI = `http://open.mapquestapi.com/geocoding/v1/address?key=${process.env.REACT_APP_MAPQUEST_KEY}&location=${location}` 
        //MapQuest geocoding API takes placename as user input and finds latitude and longitude   
            fetch(mapAPI)
                .then(response => response.json())
                .then(data => {
                    const {latLng, geocodeQualityCode} = (data.results[0].locations[0])
                    this.setState({
                        lat: latLng.lat, 
                        lon: latLng.lng,
                        quality: geocodeQualityCode
                    })
                }).then(()=> {
                    const proxy = 'https://cors-anywhere.herokuapp.com/'
                    const darkAPI = `https://api.darksky.net/forecast/${process.env.REACT_APP_API_KEY}/${this.state.lat},${this.state.lon}`
    
        return fetch(proxy + darkAPI)
        }).then(response => response.json())
        .then(data => this.setState({summary: data.currently.summary,
                                    forecast: data
                                    }))
    
    }
    
  render(){
      
      return(
      <div>
          <br />
        
        <SearchBar 
          userInput = {this.userInput}/>
          
        <Results
            quality = {this.state.quality}
            summary = {this.state.summary}
            forecast = {this.state.forecast}
            />
        </div>
        )
  
    }
          
}

export default App;

//group imports together, separate function stuff
//all arrow functions
//correct indentation
//use descriptive names for components
//filter data before mapping over it
//destructure props at the head of every component
//destructure data in fetch method
//join the two API calls
          //use callback function to call first, use return to chain the 2nd call
//use server-side app to handle darksky API request, rather than using the proxy
//refactor app with react hooks 