import Head from 'next/head'
import styles from '../styles/Home.module.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBackspace, faChartBar, faCog, faQuestionCircle, faShare, faShareAlt, faTimes } from '@fortawesome/free-solid-svg-icons'
import words from '../words';
import React from 'react'

export default class Home extends React.Component {

  constructor() {
    super();
    this.state = {
      boardState: ["", "", "", "", "", ""],
      evaluations: [null, null, null, null, null, null],
      rowIndex: 0,
      solution: "",
      gameStatus: "IN_PROGRESS",
      lastCompletedTs: null,
      lastPlayedTs: null,
      currentStreak: 0,
      gamesPlayed: 1,
      gamesWon: 0,
      guesses: {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, fail: 0},
      maxStreak: 0,
      winPercentage: 0
    }

    this.state.solution = words[this.getDayIndex()];

    this.handleKeyPress = this.handleKeyPress.bind(this);
    this.copyToClipboard = this.copyToClipboard.bind(this);
  }

  componentDidMount() {
    this.getLocalStats();
    document.addEventListener('keydown', this.handleKeyPress);

    var temp = new Date();
    var result = new Date(temp.toDateString())
    result.setDate(result.getDate() + 1);
    var countDownDate = result.getTime();

    var x = setInterval(function() {
      var now = new Date().getTime();
      var distance = countDownDate - now;
      var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      var seconds = Math.floor((distance % (1000 * 60)) / 1000);
      document.getElementById("countdown").innerHTML = ('00' + hours).slice(-2) + ":" + ('00' + minutes).slice(-2) + ":" + ('00' + seconds).slice(-2);
      if (distance < 0) {
        clearInterval(x);
        document.getElementById("countdown").innerHTML = "00:00:00";
      }
    }, 1000);
  }

  getLocalStats() {
    let stats = localStorage.getItem('stats');
    if (stats != undefined) {
      let res = JSON.parse(stats);
      let nextDay = Math.floor(res.lastPlayedTs / (24 * 60 * 60 * 1000)) == Math.floor(Date.now() / (24 * 60 * 60 * 1000)) ? false : true;
      this.setState({ 
        boardState: nextDay ? ["", "", "", "", "", ""] : res.boardState,
        evaluations: nextDay ? [null, null, null, null, null, null] : res.evaluations,
        rowIndex: nextDay ? 0 : res.rowIndex,
        gameStatus: nextDay ? "IN_PROGRESS" : res.gameStatus,
        lastCompletedTs: res.lastCompletedTs,
        lastPlayedTs: Date.now(),
        currentStreak: res.currentStreak,
        gamesPlayed: nextDay ? res.gamesPlayed + 1 : res.gamesPlayed,
        gamesWon: res.gamesWon,
        guesses: res.guesses,
        maxStreak: res.maxStreak,
        winPercentage: res.winPercentage
      })
      for (let i = 0; i < 6; i++) {
        for (let j in res.boardState[i]) {
          let letter = document.getElementById(res.boardState[i][j]);
          letter.style.backgroundColor = res.evaluations[i][j];
          letter.style.color = 'white';
        }
      }
    } else {
      this.showHelpPopup();
      stats = {
        'lastCompletedTs': 0,
        'lastPlayedTs': Date.now(),
        'currentStreak': 0,
        'gamesPlayed': 1,
        'gamesWon': 0,
        'guesses': {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, fail: 0},
        'maxStreak': 0,
        'winPercentage': 0
      }
    }
  }

  copyToClipboard() {
    if (this.state.gameStatus == 'WIN') {
      let self = this;
      let text = "WordleFR " + this.getDayIndex() + " " + (this.state.rowIndex + 1) + "/6 \n"
      for (let i = 0; i < this.state.rowIndex + 1; i++) {
        for (let j = 0; j < 5; j++) {
          if (this.state.evaluations[i][j] == "#787c7e") { text += '⬜' }
          if (this.state.evaluations[i][j] == "#6aaa64") { text += '🟩' }
          if (this.state.evaluations[i][j] == "#c9b458") { text += '🟨' }
        }
        text += '\n';
      }
      navigator.clipboard.writeText(text).then(function() {
        self.showPopup('Copié');
      }, function(err) {
        self.showPopup("Erreur");
      });
    }
  }


  getDayIndex() {
    let initialDate = new Date(2022, 0, 16);
    let daysSince = Math.floor((Date.now() - initialDate) / (24 * 60 * 60 * 1000));
    return daysSince % (words.length - 1);
  }

  handleWin() {
    let today = Date.now();
    let temp_streak = Math.floor((this.state.lastCompletedTs - today) / (24 * 60 * 60 * 1000)) <= 1 ? this.state.currentStreak + 1 : this.state.currentStreak;
    let temp_guess = this.state.guesses;
    temp_guess[this.state.rowIndex + 1] += 1
    this.setState({
      gameStatus: 'WIN',
      lastCompletedTs: today,
      lastPlayedTs: today,
      currentStreak: temp_streak,
      gamesWon: this.state.gamesWon + 1,
      guesses: temp_guess,
      maxStreak: this.state.maxStreak < temp_streak ? temp_streak : this.state.maxStreak,
      winPercentage: this.state.gamesWon + 1 / this.state.gamesPlayed
    })
    localStorage.setItem('stats', JSON.stringify(this.state));
    setTimeout(() => { this.showPopup('Gagné!') }, 1500);
    setTimeout(() => { this.showWinPage() }, 2500);
    document.removeEventListener('keydown', this.handleKeyPress);
  }

  handleKeyPress(e) {
    let tempState = this.state.boardState;
    let win_flag = true;
    let sol = this.state.solution.split('');
    if (e.key != 'Backspace' && e.key != 'Enter') {
      if (tempState[this.state.rowIndex].length < 5 && e.key.length == 1 && e.key.match(/[a-z]/i)) {
        tempState[this.state.rowIndex] += e.key;
      }
    } else if (e.key == 'Backspace' && tempState[this.state.rowIndex] != "") {
      tempState[this.state.rowIndex] = tempState[this.state.rowIndex].slice(0, -1);
    } else if (e.key == 'Enter' && tempState[this.state.rowIndex].length == 5) {
      if (words.includes(tempState[this.state.rowIndex])) {
        let temp_eval = ["#787c7e", "#787c7e", "#787c7e", "#787c7e", "#787c7e"];
        for (let i in tempState[this.state.rowIndex]) {
          if (tempState[this.state.rowIndex][i] == this.state.solution[i]) {
            temp_eval[i] = "#6aaa64";
            sol.splice(sol.indexOf(tempState[this.state.rowIndex][i]), 1);
          }
        }
        for (let j in tempState[this.state.rowIndex]) {
          if (sol.includes(tempState[this.state.rowIndex][j]) && temp_eval[j] != "#6aaa64") {
            temp_eval[j] = "#c9b458";
            sol.splice(sol.indexOf(tempState[this.state.rowIndex][j]), 1);
          }
        }
        let temp_arr = this.state.evaluations;
        temp_arr[this.state.rowIndex] = temp_eval;
        this.setState({ evaluations: temp_arr });
        for (let n in tempState[this.state.rowIndex]) {
          if (temp_eval[n] != '#6aaa64') {
            win_flag = false;
          }
          let letter = document.getElementById(tempState[this.state.rowIndex][n]);
          letter.style.backgroundColor = temp_eval[n];
          letter.style.color = 'white';
        }
        if (win_flag) {
          this.handleWin();
        } else {
          if (this.state.rowIndex < 5) {
            this.setState({ rowIndex: this.state.rowIndex + 1 });
          } else {
            setTimeout(() => { this.showPopup('Panique!') }, 1750);
            document.removeEventListener('keydown', this.handleKeyPress);
          }
        }
      } else {
        this.showPopup('Pas dans la liste');
      }
    }
    this.setState({ boardState: tempState })
  }

  showHelpPage() {
    document.getElementById('helpPage').style.top = '0';
    document.getElementById('helpPage').style.opacity = 1;
  }

  hideHelpPage() {
    document.getElementById('helpPage').style.top = '5vh';
    document.getElementById('helpPage').style.opacity = 0;
  }

  showHelpPopup() {
    document.getElementById('helpPopup').style.display = 'block';
    setTimeout(() => {
      document.getElementById('helpPopup').style.top = '0';
      document.getElementById('helpPopup').style.opacity = 1;
      document.getElementById('helpPopupContent').style.top = '15vh';
      document.getElementById('helpPopupContent').style.opacity = 1;
    }, 50);
  }

  hideHelpPopup() {
    document.getElementById('helpPopup').style.top = '5vh';
    document.getElementById('helpPopup').style.opacity = 0;
    setTimeout(() => { document.getElementById('helpPopup').style.display = 'none'; }, 500);
  }

  showSettingsPage() {
    document.getElementById('settingsPage').style.top = '0';
    document.getElementById('settingsPage').style.opacity = 1;
  }

  hideSettingsPage() {
    document.getElementById('settingsPage').style.top = '5vh';
    document.getElementById('settingsPage').style.opacity = 0;
  }

  showWinPage() {
    document.getElementById('winPage').style.top = 0;
    document.getElementById('winPage').style.opacity = 1;
    document.getElementById('winPageContent').style.top = '20vh';
    document.getElementById('winPageContent').style.opacity = 1;
  }

  hideWinPage() {
    document.getElementById('winPage').style.top = '5vh';
    document.getElementById('winPage').style.opacity = 0;
  }

  showPopup(message) {
    if (message != null) { document.getElementById('popupMessage').innerHTML = message; }
    document.getElementById('popup').style.opacity = 1;
    setTimeout(() => { document.getElementById('popup').style.opacity = 0; }, 1250);
  }

  render() {
    return (
      <div>
        <Head>
          <title>Wordle FR</title>
          <meta name="description" content="" />
          <link rel="icon" href="/fr_favicon.ico" />
        </Head>

        <main className={styles.main}>

          <header className={styles.header}>
            <button onClick={this.showHelpPage} className={styles.iconButton}>
              <FontAwesomeIcon icon={faQuestionCircle} style={{width: '20px', margin: '15px 15px', marginLeft: '5px', color: 'grey'}}/>
            </button>
            <div className={styles.title}> WORDLE<span style={{fontSize: '14px'}}>FR</span> </div>
            <div>
              <button onClick={this.showWinPage} className={styles.iconButton}>
                <FontAwesomeIcon icon={faChartBar} style={{width: '20px', margin: '15px 15px', marginRight: '0', color: 'grey'}}/>
              </button>
              <button onClick={this.showSettingsPage} className={styles.iconButton}>
                <FontAwesomeIcon icon={faCog} style={{width: '20px', margin: '15px 15px', marginRight: '5px', color: 'grey'}}/>
              </button>
            </div>
          </header>

          <div className={styles.boardContainer}>
            <div className={styles.board}>
              {this.state.boardState.map((board, i) => {
                return (<div key={i} className={styles.row}>
                  {Array.apply(null, Array(5)).map((val, j) => {
                    if (board[j] != undefined) {
                      if (this.state.evaluations[i] != null) {
                        return <div key={j} className={styles.flipBox} style={{transitionDelay: j / 4 + 's'}} id={styles.flipBoxFlip}>
                          <div style={{transitionDelay: j / 4 + 's'}} className={styles.flipBoxInner}>
                            <div className={styles.flipBoxFront}>
                              <p>{board[j]}</p>
                            </div>
                            <div className={styles.flipBoxBack} style={{ backgroundColor: this.state.evaluations[i][j]}}>
                              <p>{board[j]}</p>
                            </div>
                          </div>
                        </div>
                      } else {
                        return <div key={j} className={styles.flipBox}>
                          <div className={styles.flipBoxInner}>
                            <div className={styles.flipBoxFront}>
                              <p>{board[j]}</p>
                            </div>
                            <div className={styles.flipBoxBack}>
                              <p>{board[j]}</p>
                            </div>
                          </div>
                        </div>
                      }
                    } else {
                      return <div key={j} className={styles.emptyTile}></div>
                    }
                  })}
                </div>)
              })}
            </div>
          </div>

          <div className={styles.keyboard}>
            <div className={styles.keyboardRow}>
              <div id="a">a</div>
              <div id="z">z</div>
              <div id="e">e</div>
              <div id="r">r</div>
              <div id="t">t</div>
              <div id="y">y</div>
              <div id="u">u</div>
              <div id="i">i</div>
              <div id="o">o</div>
              <div id="p" style={{margin: 0}}>p</div>
            </div>
            <div className={styles.keyboardRow}>
              {/* <div style={{flex: '.5', margin: 0, backgroundColor: 'white'}} /> */}
              <div id="q">q</div>
              <div id="s">s</div>
              <div id="d">d</div>
              <div id="f">f</div>
              <div id="g">g</div>
              <div id="h">h</div>
              <div id="j">j</div>
              <div id="k">k</div>
              <div id="l">l</div>
              <div id="m" style={{margin: 0}}>m</div>
              {/* <div style={{flex: '.5', margin: 0, backgroundColor: 'white'}} /> */}
            </div>
            <div className={styles.keyboardRow}>
              <div style={{flex: '.5', margin: 0, backgroundColor: 'white'}} />
              <div id="enter" style={{flex: '1.5', fontSize: '12px'}}>entrée</div>
              <div id="w">w</div>
              <div id="x">x</div>
              <div id="c">c</div>
              <div id="v">v</div>
              <div id="b">b</div>
              <div id="n">n</div>
              <div id="back" style={{flex: '1.5', margin: 0}}>
                <FontAwesomeIcon icon={faBackspace} style={{width: '25px', color: 'black'}}/>
              </div>
              <div style={{flex: '.5', margin: 0, backgroundColor: 'white'}} />
            </div>
          </div>

        </main>

        <div id="helpPage" className={styles.helpPage}>
          <h4>COMMENT JOUER</h4>
          <button onClick={this.hideHelpPage} className={styles.iconButton}>
            <FontAwesomeIcon icon={faTimes} style={{width: '15px', position: 'absolute', top: 5, right: 10, color: '#878a8c'}}/>
          </button>
          
          <p style={{marginTop: 0}}>Devinez le <b>WORDLE</b> en 6 essais.</p>
          <p>Chaque réponse doit être un mot valide de 5 lettres. Appuyez sur "Entrée" pour valider.</p>
          <p>Après chaque réponse, la couleur des tuiles changera pour montrer à quel point votre réponse était proche du mot.</p>
          <div style={{borderTop: '1px solid #d3d6da', borderBottom: '1px solid #d3d6da'}}>
            <p><b>Examples</b></p>
            <img src="/weary.png" width="215px" style={{marginTop: '8px'}} />
            <p>La lettre <b>W</b> est dans le mot et au bon endroit.</p>
            <img src="/pills.png" width="215px" style={{marginTop: '8px'}} />
            <p>La lettre <b>I</b> est dans le mot mais au mauvais endroit.</p>
            <img src="/vague.png" width="215px" style={{marginTop: '8px'}} />
            <p>La lettre <b>U</b> n'est pas dans le mot à aucun endroit.</p>
          </div>
          <p><b>Un nouveau WORDLE sera disponible chaque jour!</b></p>
        </div>

        <div id="settingsPage" className={styles.settingsPage}>
          <h4>PARAMÈTRES</h4>
          <button onClick={this.hideSettingsPage} className={styles.iconButton}>
            <FontAwesomeIcon icon={faTimes} style={{width: '15px', position: 'absolute', top: 5, right: 10, color: '#878a8c'}}/>
          </button>
          
          <div>
            <p style={{float: 'left'}}>Feedback</p>
            <a className={styles.emailLink} href="mailto:bortalomagne@gmail.com?subject=Feedback"><u>Email</u></a>
          </div>
        </div>

        <div id="winPage" className={styles.winPage}>
          <div id="winPageContent">
            <button onClick={this.hideWinPage} className={styles.iconButton}>
              <FontAwesomeIcon icon={faTimes} style={{width: '15px', position: 'absolute', top: 15, right: 20, color: '#878a8c'}}/>
            </button>

            <h4>STATISTIQUES</h4>

            <div className={styles.statistics}>
              <div>
                <div>{this.state.gamesPlayed}</div>
                <div style={{fontSize: '12px'}}>Joué</div>
              </div>
              <div>
                <div>{Math.round(this.state.winPercentage * 100)}</div>
                <div style={{fontSize: '12px'}}>% Gagné</div>
              </div>
              <div>
                <div>{this.state.currentStreak}</div>
                <div style={{fontSize: '12px'}}>Streak Courant</div>
              </div>
              <div>
                <div>{this.state.maxStreak}</div>
                <div style={{fontSize: '12px'}}>Streak Max</div>
              </div>
            </div>

            <div className={styles.timerShare} style={this.state.gameStatus != 'WIN' ? {display: 'none'} : null}>
              <div className={styles.timer}>
                <p style={{margin: '10px 0'}}>PROCHAIN WORDLE</p>
                <p style={{ fontSize: '36px', fontWeight: '400', margin: 0 }} id="countdown"></p>
              </div>
              <div className={styles.shareButton}>
                <button onClick={this.copyToClipboard}>
                  Partager 
                  <FontAwesomeIcon icon={faShareAlt} style={{width: '24px', color: 'white', paddingLeft: '10px'}}/>
                </button>
              </div>
            </div>

          </div>
        </div>

        <div id="helpPopup" className={styles.helpPopup}>
          <div id="helpPopupContent" style={{height: '550px'}}>
            <button onClick={this.hideHelpPopup} className={styles.iconButton}>
              <FontAwesomeIcon icon={faTimes} style={{width: '15px', position: 'absolute', top: 15, right: 20, color: '#878a8c'}}/>
            </button>

            <p style={{marginTop: '15px'}}>Devinez le <b>WORDLE</b> en 6 essais.</p>
            <p>Chaque réponse doit être un mot valide de 5 lettres. Appuyez sur "Entrée" pour valider.</p>
            <p>Après chaque réponse, la couleur des tuiles changera pour montrer à quel point votre réponse était proche du mot.</p>
            <div style={{borderTop: '1px solid #d3d6da', borderBottom: '1px solid #d3d6da'}}>
              <p><b>Examples</b></p>
              <img src="/weary.png" width="215px" style={{marginTop: '8px'}} />
              <p>La lettre <b>W</b> est dans le mot et au bon endroit.</p>
              <img src="/pills.png" width="215px" style={{marginTop: '8px'}} />
              <p>La lettre <b>I</b> est dans le mot mais au mauvais endroit.</p>
              <img src="/vague.png" width="215px" style={{marginTop: '8px'}} />
              <p>La lettre <b>U</b> n'est pas dans le mot à aucun endroit.</p>
            </div>
            <p><b>Un nouveau WORDLE sera disponible chaque jour!</b></p>

          </div>
        </div>

        <div id="popup" className={styles.popup}>
          <h4 id="popupMessage"></h4>
        </div>

      </div>
    )
  }
}
