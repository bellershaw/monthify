import './App.css';
import {React, useEffect, useState} from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {faGithub, faLinkedin, faInstagram, faSpotify} from "@fortawesome/free-brands-svg-icons";
import DatePicker from "react-datepicker";
import moment from 'moment';
import "react-datepicker/dist/react-datepicker.css";
import spotifyLogo from './spotify-logo.png'
function App() {
  const CLIENT_ID = "e818c8d017e44f9ba18d50e657944669"
  //const REDIRECT_URI = "https://bellershaw.github.io/monthify"
  const REDIRECT_URI = "http://localhost:3000"
  const SCOPE = "playlist-read-private playlist-read-collaborative playlist-modify-public user-library-read"
  const [token, setToken] = useState("")
  const [uname, setUname] = useState("")
  const [userID, setUserID] = useState("")
  const [hasRun, sethasRun] = useState(false)

  const [playlistIDs, setPlaylistIDs] = useState([])
  const [playlistURLs, setPlaylistURLs] = useState([])
  const [playlistLen, setPlaylistLen] = useState(0)
  const [playlistNames, setPlaylistNames] = useState([] )
  const [monthifyNames, setMonthifyNames] = useState([])
  const [monthifyIDs, setMonthifyIDs] = useState([])

  const [firstMonth, setFirstMonth] = useState(new Date());
  const [lastMonth, setLastMonth] = useState(new Date());

  
  //check for and extract access token after use logs in
  useEffect(() => {
    console.log("in use")
    const urlParams = new URLSearchParams(window.location.search);
    let code = urlParams.get('code');
    let token = window.localStorage.getItem("access_token")
  
    if(token){
      console.log("returning", token)
      setToken(token)
      return;
    }
    if (code){
      let codeVerifier = localStorage.getItem('code_verifier');
      let body = new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URI,
        client_id: CLIENT_ID,
        code_verifier: codeVerifier
      });

      const response = fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: body
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('HTTP status ' + response.status);
        }
        return response.json();
      })
      .then(data => {
        localStorage.setItem('access_token', data.access_token);
        setToken(data.access_token)
      })
      .catch(error => {
        console.error('Error:', error);
      });
    }

  }, [])

  useEffect(() => {
    if (token){
      getUname()
    }
  }, 
  [token]
  );

  function generateRandomString(length) {
    let text = '';
    let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  
    for (let i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  async function generateCodeChallenge(codeVerifier) {
    function base64encode(string) {
      return btoa(String.fromCharCode.apply(null, new Uint8Array(string)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    }
  
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
  
    return base64encode(digest);
  }

  async function requestAuth(){
  let codeVerifier = generateRandomString(128);

  generateCodeChallenge(codeVerifier).then(codeChallenge => {
    let state = generateRandomString(16);
  
    localStorage.setItem('code_verifier', codeVerifier);
  
    let args = new URLSearchParams({
      response_type: 'code',
      client_id: CLIENT_ID,
      scope: SCOPE,
      redirect_uri: REDIRECT_URI,
      state: state,
      code_challenge_method: 'S256',
      code_challenge: codeChallenge
    });
  
    window.location = 'https://accounts.spotify.com/authorize?' + args;
  });
  }
  async function addSongs(track_list, playlist_id){
    console.log("adding tracklist", track_list)
    console.log("to playlist", playlist_id)

    axios.post(`https://api.spotify.com/v1/playlists/${playlist_id}/tracks`, {
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
    getMonthifyNames()
    if(!hasRun){
      let Months = ['January', 'February', 'March', 'April',
                'May', 'June', 'July', 'August', 'September',
                'October', 'November', 'December']
      sethasRun(true)
      console.log(`token here: ${token}`)
      let next = "https://api.spotify.com/v1/me/tracks?limit=50";
      let data = ""
      firstMonth.setHours(0,0,0)
      firstMonth.setDate(1)
      lastMonth.setHours(23,59,59)
      let current_month = (lastMonth.getMonth() + 1) % 12
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

        console.log("track data: ", track_data);
        //console.log("data items:", data.items)

        for (let i = 0; i < track_data.items.length; i++){
          //console.log("in name search loop: ", i, " ", data.items[i].track.name)

          let added_date = track_data.items[i].added_at
          let added_year = parseInt(added_date.substring(0, 4))
          let added_month = parseInt(added_date.substring(5, 7))
          let added_day = parseInt(added_date.substring(8,10))

          added_date = new Date(added_year, added_month-1, added_day)

          //break if current date is before target date
          if (firstMonth > added_date)
            {
              console.log(firstMonth, added_date)
              console.log("TRIGGERED")
              next = null
              if(track_list.length != 0){
                addSongs(track_list, playlist_id)
                track_list = []
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
                    track_list = []
              
                  }
                  
                  track_list = []
                  console.log("current month:", Months[current_month])
                  let playlist_name =  "Monthify " + Months[current_month] + " " + added_date.getFullYear() + String.fromCharCode(9)
                  let test_name =  "Monthify " + Months[current_month] + " " + added_date.getFullYear()
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
                  console.log("playlist_data", playlist_data)

                  console.log("url", playlist_data.data.external_urls.spotify)
                  console.log("is equal to",playlist_name === playlist_data.data.name)
                  console.log("is equal to test",test_name === playlist_data.data.name)
                  playlistURLs.push(playlist_data.data.external_urls.spotify)
                  playlistIDs.push(playlist_id)
                  playlistNames.push(playlist_name)

                  let tmp_id = ""
                  let tmp_name = ""
                  console.log(monthifyNames)
                  for (let i = 0; i < monthifyNames.length; i++){
                    if(monthifyNames[i] === playlist_name){
                      console.log("deleting", monthifyNames[i], monthifyIDs[i])
                      tmp_id = monthifyIDs[i]
                      tmp_name = monthifyNames[i]
                      let delete_data = await axios.delete(`https://api.spotify.com/v1/playlists/${monthifyIDs[i]}/followers`, {                        
                        headers: {
                        'Authorization': `Bearer ${token}`
                    }}, {

                    }
                    )

                    }
                  }
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
          })
        }
        while(image_data.data.length == 0);
        console.log(image_data)
        const playlist_gallery = document.getElementById("PlaylistScroller") 
        console.log(image_data)

        const playlist_link = document.createElement("a")
        playlist_link.setAttribute("href", playlistURLs[i])
        playlist_link.setAttribute("target", "_blank")

        const image_div = document.createElement("div")
        image_div.className = "Image-div"
        playlist_link.appendChild(image_div)

        const playlist_image = document.createElement("IMG")
        playlist_image.src = image_data.data[0].url
        playlist_image.className = "Playlist-image"
        image_div.appendChild(playlist_image)

        const spotify_logo = document.createElement("IMG")
        spotify_logo.src=spotifyLogo
        //let p_prime = p.cloneNode(true);
        //playlist_link.appendChild(p_prime)
        //spotify_logo.setAttribute("icon", "{faSpotify}")
        spotify_logo.className = "Spotify-logo"
        image_div.appendChild(spotify_logo)
        //spotify_logo.setAttribute("style", "{{color:#1db954}}")
        //spotify_logo.setAttribute("size", "2xl")
        //playlist_link.insertAdjacentHTML('beforeend','<i class="fa-brands fa-spotify fa-2xl" style="color: #1f512b;"></i>')

        const playlist_label = document.createElement("h2")
        playlist_label.innerHTML = playlistNames[i].substring(playlistNames[i].indexOf(" ") + 1, playlistNames[i].length - 1)
        playlist_label.className = "Playlist-label"
        playlist_link.appendChild(playlist_label)

        playlist_gallery.append(playlist_link)
      }
      setPlaylistLen(playlistNames.length)
      console.log("playlistlen", playlistLen)
      setPlaylistIDs([])
      setPlaylistURLs([])
      setPlaylistNames([])
      setMonthifyNames([])
      setMonthifyIDs([])
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
    window.localStorage.removeItem("access_token")
  }
  //get user's profile
  async function getUname(){
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

async function getMonthifyNames(){
  let next = "https://api.spotify.com/v1/me/playlists?limit=50";
  setMonthifyNames([])
  while (!!next){
    //console.log("inside while loop")
    //console.log("next in loop: ", next)
    let data = await axios.get(next, {
        headers: {
            Authorization: `Bearer ${token}`
        },
    })
    next = data.data.next
    console.log("playlist data while grabbing:", data)
    for(let i = 0; i < data.data.items.length; i++){
      if(data.data.items[i].name.includes("Monthify")){
        monthifyNames.push(data.data.items[i].name)
        monthifyIDs.push(data.data.items[i].id)
      }
    }
}
console.log("names", monthifyNames)
console.log("ids", monthifyIDs)
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
            ?<button className="Log-button" onClick={() => requestAuth()}>Login to Spotify </button>
            :<div className="Month-select">
              <h2 className="Welcome">Hello, {uname}</h2>
              <h3 className="Month-label">First Month:
              <DatePicker
                onFocus={(e) => e.target.readOnly = true}
                className='Calendar'
                selected={firstMonth}
                showMonthYearPicker
                dateFormat="MMMM yyyy"
                maxDate={moment().toDate()}
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
                maxDate={moment().toDate()}
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
              {(playlistLen > 4)
              ? <button id="clickLeft" type="button" className="Scroll-button" onClick={scrollLeft}>&lt;</button> 
              : <></>}
              
              <div id="PlaylistScroller" className="Playlist-scroller">
              </div>
              {(playlistLen > 4)
              ?<button id="clickRight" type="button" className="Scroll-button" onClick={scrollRight}>&gt;</button>
              :<></>
              }
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
