import './App.css';
import {useEffect, useState} from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {faGithub, faLinkedin, faInstagram} from "@fortawesome/free-brands-svg-icons";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
function App() {
  const CLIENT_ID = "e818c8d017e44f9ba18d50e657944669"
  const REDIRECT_URI = "http://localhost:3000"
  const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize"
  const RESPONSE_TYPE = "token"

  const [token, setToken] = useState("")
  const [uname, setUname] = useState("")
  const [playlists, setPlaylists] = useState("")
  const [hasRun, sethasRun] = useState(false)
  const [grabbed, setGrabbed] = useState("0")
  const [firstMonth, setFirstMonth] = useState(new Date());
  const [lastMonth, setLastMonth] = useState(new Date());

  //check for and extract access token after use logs in
  useEffect(() => {
    const hash = window.location.hash
    let token = window.localStorage.getItem("token")
  
    if (!token && hash) {
        token = hash.substring(1).split("&").find(elem => elem.startsWith("access_token")).split("=")[1]
  
        window.location.hash = ""
        window.localStorage.setItem("token", token)

    }
//
    setToken(token)
  }, [])

  useEffect(() => {
    if (token){
      getUname()
      //getLiked()
    }
  }, 
  [token]
  );

  const get_auth = async () => {
    const {data} = await axios.get("https://accounts.spotify.com/authorize", {
      headers: {
          client_id: CLIENT_ID,
          scope: "user-library-read",
          redirect_uri: REDIRECT_URI,
          response_type: RESPONSE_TYPE
      },
      params: {}
  })

    setToken(data.data.access_token)
  }

  const scrollRight = () => {
    document.getElementById('PlaylistScroller').scrollBy({
      top:0,
      left: 500,
      behavior: 'smooth'
    });
  }

  const scrollLeft = () => {
    document.getElementById('PlaylistScroller').scrollBy({
      top:0,
      left: -500,
      behavior: 'smooth'
    });
  }
  //log out
  const logout = () => {
    setToken("")
    setUname("")
    window.localStorage.removeItem("token")
  }
  //get user's profile
  const getUname = async (e) => {
    console.log(`token here: ${token}`)
    const {data} = await axios.get("https://api.spotify.com/v1/me", {
        headers: {
            Authorization: `Bearer ${token}`
        },
        params: {}
    })

    setUname(data.display_name)
}

const getliked = async (e) => {
  console.log(grabbed)
  if (grabbed == "0"){
    setGrabbed("1")
    console.log(grabbed)
    console.log(`token here: ${token}`)
    let next = "https://api.spotify.com/v1/me/tracks?limit=50";
    let data = 'test'
    while (!!next){
      console.log("inside while loop")
      console.log("next in loop: ", next)
      data = await axios.get(next, {
          headers: {
              Authorization: `Bearer ${token}`
          },
          params: {}
      })
      data = data.data;
      next = data.next;
      console.log("data: ", data);
      console.log("data items:", data.items)
      for (let i = 0; i < data.items.length; i++){
        console.log("in name search loop: ", i, " ", data.items[i].track.name)
        if (data.items[i].track.name === "Out of Bounds")
          {
            console.log("found liked: ", data.items[i].id)
            i = 999999999
            break

          }
        }
      console.log("playlist in loop: ", data.items)
      console.log("next after loop", next)
      }

    console.log("setting playlists")
    setPlaylists(data.items)
    console.log("playlists: ", playlists)
  }
}

  return (
    <div className="App">
      <header className="App-header">
      <h1>Monthify</h1>
      <h2 className="App-description">
        {!uname ? `Create Monthly Playlists From Your Liked Songs${uname}` : <></>}
        </h2>
      </header>
      <body className="App-body">
        {!token || hasRun == 0
          ?
          <div className='After-log'>
            {!token
            ?<a href={`${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${RESPONSE_TYPE}&scope=user-library-read`}><button className="Log-button">Login to Spotify </button></a>
            :<div className="Month-select">
              <h2 className="Welcome">Hello, {uname}</h2>
              <h3 className="Month-label">First Month:
              <DatePicker
                onFocus={(e) => e.target.readOnly = true}
                className='Calendar'
                selected={firstMonth}
                showMonthYearPicker
                dateFormat="MMMM yyyy"
                onSelect={(date) => setFirstMonth(date)}
                withPortal
                />
                </h3>
              <h3 className="Month-label">Last Month:
              <DatePicker className='Calendar'
                onFocus={(e) => e.target.readOnly = true}
                selected={lastMonth}
                showMonthYearPicker
                dateFormat="MMMM yyyy"
                onSelect={(date) => setLastMonth(date)}
                withPortal
                />
              </h3>
            <button className="Log-button" onClick={() => sethasRun(true)}>Make Playlists</button>
            </div>
            }
          </div>
          :
          <div className="After-log">
            <div className='Scroll-menu'>
              <button id="clickLeft" type="button" className="Scroll-button" onClick={scrollLeft}>&lt;</button>
              <div id="PlaylistScroller" className="Playlist-scroller">
                <img className="Playlist-image" src="/doge.png"/>
                <img className="Playlist-image" src="/doge.png"/>
                <img className="Playlist-image" src="/doge.png"/>
                <img className="Playlist-image" src="/doge.png"/>
                <img className="Playlist-image" src="/doge.png"/>
                <img className="Playlist-image" src="/doge.png"/>
                <img className="Playlist-image" src="/doge.png"/>
                <img className="Playlist-image" src="/doge.png"/>
                <img className="Playlist-image" src="/doge.png"/>
              </div>
              <button id="clickRight" type="button" className="Scroll-button" onClick={scrollRight}>&gt;</button>
            </div>
            <button className="Log-button" onClick={() => sethasRun(false)}>Back</button>
          </div>
          
        }

        {token?
        <button className="Log-button" onClick={logout}>Logout of Spotify</button>
        :<></>
        }
      </body>
      <footer className="App-footer">
        <h5>Created by Braeden Ellershaw - braeden.ellershaw@gmail.com
          <a className="Social-icon" href={'https://github.com/bellershaw/Monthify'}>
          <FontAwesomeIcon icon={faGithub} size="2xl"/>
          </a>
          <a className="Social-icon" href={'https://linkedin.com/in/bellershaw'}>
          <FontAwesomeIcon icon={faLinkedin} size="2xl" />
          </a>
          <a className="Social-icon" href={'https://instagram.com/b.ellershaw'}>
          <FontAwesomeIcon icon={faInstagram} size="2xl" />
          </a>
        </h5>
      </footer>
    </div>
  );
}

export default App;
