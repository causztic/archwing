import React, { Component } from 'react'
import { Route } from 'react-router'
import HomeContainer from './layouts/home/HomeContainer'


// Styles
import './css/futura.css'
import './css/open-sans.css'
import './css/pure-min.css'
import './css/grids-responsive-min.css'
import './App.sass'

class App extends Component {
  render() {
    return (
      <div className="App">
        <Route exact path="/" component={HomeContainer}/>
        <footer>
          All Rights Reserved © 2018.
          <a href="https://github.com/causztic/archwing">Source Code</a>
        </footer>
      </div>
    );
  }
}

export default App
