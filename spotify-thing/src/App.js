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
  const [userID, setUserID] = useState("")
  const [playlists, setPlaylists] = useState("")
  const [playlistIDs, setPlaylistIDs] = useState([])
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


  async function addSongs(track_list, playlist_id){
    console.log("adding tracklist", track_list)
    console.log("to playlist", playlist_id)

    let add_track_data = await axios.post(`https://api.spotify.com/v1/playlists/${playlist_id}/tracks`, {
        "uris": track_list
      },{
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
      }
    )

  }
  
  async function makePlaylist(){

    console.log("making playlist")
    if(!hasRun){
      let Months = ['January', 'February', 'March', 'April',
                'May', 'June', 'July', 'August', 'September',
                'October', 'November', 'December']
      sethasRun(true)
      console.log(`token here: ${token}`)
      let next = "https://api.spotify.com/v1/me/tracks?limit=50";
      let data = ""
      firstMonth.setHours(0,0,0)
      lastMonth.setHours(23,59,59)
      let current_month = (lastMonth.getMonth() + 1) % 12
      let current_month_string = Months[lastMonth.getMonth()];
      let playlist_id = ""
      console.log(current_month, lastMonth.getFullYear())
      //current_month = (current_month-1) % mod 12
      let track_list = [];
      while (!!next){
        //console.log("inside while loop")
        //console.log("next in loop: ", next)
        data = await axios.get(next, {
            headers: {
                Authorization: `Bearer ${token}`
            },
            params: {}
        })

        let track_data = data.data;
        next = track_data.next;

        //console.log("data: ", data);
        //console.log("data items:", data.items)

        for (let i = 0; i < track_data.items.length; i++){
          //console.log("in name search loop: ", i, " ", data.items[i].track.name)

          let added_date = track_data.items[i].added_at
          let added_year = parseInt(added_date.substring(0, 4))
          let added_month = parseInt(added_date.substring(5, 7))

          added_date = new Date(added_year, added_month-1)

          //break if current date is before target date
          if (firstMonth > added_date)
            {
              console.log(firstMonth, added_date)
              console.log("TRIGGERED")
              next = null
              if(track_list.length != 0){
                addSongs(track_list, playlist_id)
              }
              break
  
            }

         if (lastMonth >= added_date && firstMonth <= added_date)
            {

              //if new month
              if(current_month != added_date.getMonth()){ 
                //make playlist
                  current_month = added_date.getMonth()
                  if(track_list.length != 0){
                    console.log("adding ", track_list, " to ")
                    addSongs(track_list, playlist_id)
              
                  }
                  
                  track_list = []
                  console.log("current month:", Months[current_month])
                  let playlist_name =  "Monthify " + Months[current_month] + " " + added_date.getFullYear()
                  console.log("create playlist:", playlist_name);
                  
                  let playlist_data = await axios.post(`https://api.spotify.com/v1/users/${userID}/playlists`, {
                    name: playlist_name,
                    public: true
                }, {
                    headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json',
                  }
                }
                )
                
                console.log("data here", playlist_data)
                if (typeof data != "undefined"){
                  playlist_id = playlist_data.data.id
                  playlistIDs.push(playlist_id)
                }
                
                track_list = []
                
                }
                //console.log("will add", track_data.items[i].track.name, " to ", Months[current_month], added_date.getFullYear())
                track_list.push(track_data.items[i].track.uri)
            }
          }
          console.log("playlist id right here",playlist_id)
          console.log("tracklist",track_list)
          if(track_list.length!=0){
          addSongs(track_list, playlist_id)
          track_list = []
          }
          console.log(next)
      }
      //add playlist images
      console.log(playlistIDs)
      for (let i = 0; i < playlistIDs.length; i++){
        let image_data = ""
          do {
            console.log("getting image from playlist", playlistIDs[i])
            image_data = await axios.get(`https://api.spotify.com/v1/playlists/${playlistIDs[i]}/images`, {
              headers: {
                  Authorization: `Bearer ${token}`
              },
              params: {}
          })
        }
        while(image_data.data.length == 0);
        console.log(image_data)
        const playlist_gallery = document.getElementById("PlaylistScroller") 
        console.log(image_data)
        const playlist_image = document.createElement("IMG")
        playlist_image.src = image_data.data[0].url
        playlist_image.className = "Playlist-image"
        playlist_gallery.append(playlist_image)
        setPlaylistIDs([])
      }
    }
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

    console.log("user id", data.id)
    setUname(data.display_name)
    setUserID(data.id)
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
            ?<a href={`${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${RESPONSE_TYPE}&scope=user-library-read playlist-modify-public`}><button className="Log-button">Login to Spotify </button></a>
            :<div className="Month-select">
              <h2 className="Welcome">Hello, {uname}</h2>
              <h3 className="Month-label">First Month:
              <DatePicker
                onFocus={(e) => e.target.readOnly = true}
                className='Calendar'
                selected={firstMonth}
                showMonthYearPicker
                dateFormat="MMMM yyyy"
                onSelect={(first_date) => setFirstMonth(first_date)}
                withPortal
                />
                </h3>
              <h3 className="Month-label">Last Month:
              <DatePicker className='Calendar'
                onFocus={(e) => e.target.readOnly = true}
                selected={lastMonth}
                showMonthYearPicker
                dateFormat="MMMM yyyy"
                onSelect={(last_date) => setLastMonth(new Date(last_date.getFullYear(), last_date.getMonth() +1, 0))}
                withPortal
                />
              </h3>
            <button className="Log-button" onClick={() => makePlaylist()}>Make Playlists</button>
            </div>
            }
          </div>
          :
          <div className="After-log">
            <div className='Scroll-menu'>
              <button id="clickLeft" type="button" className="Scroll-button" onClick={() => scrollLeft}>&lt;</button>
              <div id="PlaylistScroller" className="Playlist-scroller">
              </div>
              <button id="clickRight" type="button" className="Scroll-button" onClick={() => scrollRight}>&gt;</button>
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
