import React, { useState, useEffect } from "react";
import "./App.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSun as sun,
  faMoon as moon,
  faCloud as cloud,
  faCloudRain as rain,
  faSnowflake as snow,
  faWind as wind,
  faCloudSun as partlyCloudyDay,
  faCloudMoon as partlyCloudyNight
} from "@fortawesome/free-solid-svg-icons";
import momentTZ from "moment-timezone";
import moment from "moment";

momentTZ()
  .tz("America/Los_Angeles")
  .format();
moment().format();

//component for hourly forecast
const Hourly = ({ iconPicker, hourlyData }) => {
  //Convert the hourly forecast object into an array-like object with Object.entries
  //Filter object for 6 forecasts at 2-hour intervals, then map over it
  //Use moments.js to convert the UNIX timestamps for each forecast into hh format, adjusted to the user's timezone
  const forecastHours = Object.entries(hourlyData)
    .filter((el, index) => {
      return !(index % 2) && index < 12;
    })
    .map((el, index) => {
      const icon = el[1].icon;
      const timeZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const date = moment
        .unix(el[1].time)
        .tz(timeZ)
        .format("hA");

      //use iconPicker to determine which icon is displayed for each hour
      return (
        <div key={index}>
          <p>{date}</p>
          <p>
            <FontAwesomeIcon icon={iconPicker(icon)} />
          </p>
          <p>{Math.round(el[1].temperature)}°F</p>
        </div>
      );
    });

  return <div className="container">{forecastHours}</div>;
};

//component for error handling
const Error = () => (
  <div>
    <br />
    <i>Location not found.</i>
  </div>
);

//component to return all weather data
const WeatherData = ({ forecast, summary }) => {
  if (!forecast.currently) {
    return "";
  }
  //if the sun icon is displayed, color it yellow
  //all other icons remain white
  let iconColor = "white";
  if (forecast.currently.icon === "clear-day") {
    iconColor = "yellow";
  }

  const icon = forecast.currently.icon;

  //determine which fontawesome icon to display
  const iconPicker = icono => {
    if (icono === "clear-day") {
      return sun;
    }
    if (icono === "clear-night") {
      return moon;
    }
    if (icono === "rain") {
      return rain;
    }
    if (icono === "snow" || icono === "sleet") {
      return snow;
    }
    if (icono === "wind") {
      return wind;
    }
    if (icono === "cloudy" || icono === "fog") {
      return cloud;
    }
    if (icono === "partly-cloudy-day") {
      return partlyCloudyDay;
    }
    if (icono === "partly-cloudy-night") {
      return partlyCloudyNight;
    }
  };

  return (
    <div>
      <p className="med">{summary}</p>
      <p>
        <FontAwesomeIcon icon={iconPicker(icon)} size="5x" color={iconColor} />
      </p>
      <p className="huge">{Math.round(forecast.currently.temperature)}°F</p>
      <p className="highLow">
        H: {Math.round(forecast.daily.data[0].temperatureHigh)}°F L:{" "}
        {Math.round(forecast.daily.data[0].temperatureLow)}°F
      </p>
      <Hourly hourlyData={forecast.hourly.data} iconPicker={iconPicker} />
    </div>
  );
};

//component that selects error handler or weather data components based on geocoding API quality score
const Results = ({ summary, forecast, quality }) => {
  if (quality === 0) {
    return <Error />;
  }

  //otherwise, return weather data component
  return (
    <div>
      <WeatherData summary={summary} forecast={forecast} />
    </div>
  );
};

const Fetcher = ({ location }) => {
  const [weather, setWeather] = useState({
    summary: "",
    forecast: {},
    quality: ""
  });
  const mapAPI = `https://api.opencagedata.com/geocode/v1/json?q=${location}&key=${process.env.REACT_APP_OPENCAGE_KEY}&pretty=1`;

  useEffect(() => {
    fetch(mapAPI)
      .then(response => response.json())
      .then(data => {
        const { confidence } = data.results[0];
        const { lat, lng } = data.results[0].geometry;
        return { lat, lng, confidence };
      })
      .then(({ lat, lng, confidence }) => {
        const proxy = "https://cors-anywhere.herokuapp.com/";
        const darkAPI = `https://api.darksky.net/forecast/${process.env.REACT_APP_API_KEY}/${lat},${lng}`;
        return fetch(proxy + darkAPI)
          .then(response => response.json())
          .then(data => {
            setWeather({
              summary: data.currently.summary,
              forecast: { ...data },
              quality: confidence
            });
          });
      });
  }, [mapAPI]);

  return (
    <div>
      <Results
        quality={weather.quality}
        summary={weather.summary}
        forecast={weather.forecast}
      />
    </div>
  );
};

//component for user to input placename
const SearchBar = () => {
  const [location, setLocation] = useState("");

  const submitter = e => {
    e.preventDefault();
    setLocation(e.target.elements.entry.value);
  };

  return (
    <div>
      <form onSubmit={submitter}>
        <input type="text" name="entry" placeholder="City, State" />
        <button>Submit</button>
      </form>
      {location.length > 0 && <Fetcher location={location} />}
    </div>
  );
};

//main application
const App = () => {
  return (
    <div>
      <br />
      <SearchBar />
    </div>
  );
};

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
//setStates all at once, otherwise each will trigger a re-render which can occurr before the other states are set
//return lat/lng as parameters rather than setting state
//split up components into separate component files
