$(document).ready(function(){
  console.log("Starting application: Minesweepr");

  //Future: make these user inputs
  //configurations
  var cols = 10;
  var rows = 10;
  var difficulty = 0.25; //mine density 0-1
  
  var minefield = new Minefield("#minefield", cols, rows, difficulty);

  minefield.build_minefield();
  minefield.populate_bombs();
  
  $("#msgid").html("This is Hello World by JQuery");
});

class Minefield {
  
  
  constructor(id, cols, rows, difficulty) {
    this.id = id;
    this.cols = cols;
    this.rows = rows;
    this.difficulty = difficulty;
    this.num_bombs = Math.floor(cols * rows * difficulty);
    this.flagged = 0;
    this.game_over = false;
    this.state_enum = {
      CLOSED_NOBOMB: 0,
      CLOSED_BOMB: 1,
      OPENED_NOBOMB: 2,
      OPENED_BOMB: 3,
      FLAGGED: 4
    };
  }

  build_minefield() {
    for(var i = 0; i < this.rows; i++) {
      var $row = $("<div />", { class: 'row'});
      for(var j = 0; j < this.cols; j++) {
        var $cell = $("<div />", { class: 'cell blank', id: 'cell-'+i+'-'+j});
        $row.append($cell);
      }
      $(this.id).append($row.clone());
    }
  }

  populate_bombs() {
    //construct 2D array to hold state
    this.state = new Array(this.rows);
    for(var i = 0; i < this.rows; i++) {
      this.state[i] = new Array(this.cols).fill(this.state_enum.CLOSED_NOBOMB);
    }

    //populate with bombs
    var populated = 0;

    //randomly assign bombs
    while(populated < this.num_bombs) {
      var row = getRandomInt(0, this.rows);
      var col = getRandomInt(0, this.cols);
      if(this.state[row][col] == this.state_enum.CLOSED_NOBOMB) {
        this.state[row][col] = this.state_enum.CLOSED_BOMB;
        populated++;
      }
    }
    console.log("Number of bombs being populated: " + populated);
    console.log(this.state);
  }


}
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}
/*
  static 

    //populate bombs and states of saures
    //0 - unopened and no bomb
    //1 - unopened and bomb
    //2 - opened 
    var state = new Array(rows);
    for(var i = 0; i < cols; i++) {
      
    }
    var bombs = 0;
    console.log("Total Bombs: " + Math.floor(length(state)));
    //while(bombs < floorlen(state) * 
*/
