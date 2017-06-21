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
  
  $(".cell").mousedown(function(event) {
    switch (event.which) {
      case 1:
        minefield.left_click(this);
        break;
      case 3:
        minefield.right_click(this);
        break;
      default:
        minefield.left_click(this);
    }
  });

});

class Minefield {
  constructor(id, cols, rows, difficulty) {
    this.id = id;
    this.cols = cols;
    this.rows = rows;
    this.difficulty = difficulty;
    this.num_bombs = Math.floor(cols * rows * difficulty);
    this.flagged = 0;
    this.false_flagged = 0;
    this.game_over = false;
    this.state_enum = {
      CLOSED_NOBOMB: 0,
      CLOSED_BOMB: 1,
      OPENED_NOBOMB: 2,
      OPENED_BOMB: 3,
      FLAGGED_NOBOMB: 4,
      FLAGGED_BOMB: 5
    };
  }
 get_coordinates(cell) {
    var row = $(cell).attr('row');
    var col = $(cell).attr('col');
    console.log(row+'  '+col);
    return [row, col];
  }
  build_minefield() {
    for(var i = 0; i < this.rows; i++) {
      var $row = $("<div />", { class: 'row'});
      for(var j = 0; j < this.cols; j++) {
        var $cell = $("<div />", { class: 'cell blank', id: 'cell-'+i+'-'+j, row: i, col: j});
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
    //populate and randomely assign bombs
    var bomb_population = 0;
    while(bomb_population < this.num_bombs) {
      var row = getRandomInt(0, this.rows);
      var col = getRandomInt(0, this.cols);
      if(this.state[row][col] == this.state_enum.CLOSED_NOBOMB) {
        this.state[row][col] = this.state_enum.CLOSED_BOMB;
        bomb_population++;
      }
    }
    console.log("Number of bombs being populated: " + bomb_population);
  }

  //MAINLY FOR FLAGGING AND UNFLAGGING
  right_click(cell) {
    if(this.game_over) {
      return;
    }
    var [row,col] = this.get_coordinates(cell);
    console.log("Right click at:" + row + ", " + col);
    console.log("State before: " + this.state[row][col]);
    switch(this.state[row][col]) {
      //already opened nothing to do
      case this.state_enum.OPENED_BOMB:
        console.log("ERROR: shouldn't get here - since game is lost...");
        break;
      case this.state_enum.OPENED_NOBOMB:
        break;
      //closed we flag it
      case this.state_enum.CLOSED_BOMB:
        this.state[row][col] = this.state_enum.FLAGGED_BOMB;
        this.flagged++;
        flag_cell(this.id, row, col);
        break;
      case this.state_enum.CLOSED_NOBOMB:
        this.state[row][col] = this.state_enum.FLAGGED_NOBOMB;
        this.false_flag++;
        flag_cell(this.id, row, col);
        break;
      //already flagged - unflag it
      case this.state_enum.FLAGGED_BOMB:
        this.state[row][col] = this.state_enum.CLOSED_BOMB;
        this.flagged--;
        unflag_cell(this.id, row, col);
        break;
      case this.state_enum.FLAGGED_NOBOMB:
        this.state[row][col] = this.state_enum.CLOSED_NOBOMB;
        this.false_flag--;
        unflag_cell(this.id, row, col);
        break;
      default:
        console.log("ERROR: hit deafult on right click");
        break;
    }
    console.log("State after: " + this.state[row][col]);
    this.check_win(); 
  }

  //FOR OPENING CELLS
  left_click(cell) {
    if(this.game_over) {
      return;
    }
    var [row, col] = this.get_coordinates(cell);
    console.log("Left click at:" + row + ", " + col);
    switch(this.state[row][col]) {
      //case this.state_enum.OPENED_BOMB:
      //case this.state_enum.OPENED_NOBOMB:
      case this.state_enum.CLOSED_NOBOMB:
        open_cell(this.id, row, col, false, 0);
        //check nearby cells
        break;
      case this.state_enum.CLOSED_BOMB:
        open_cell(this.id, row, col, true);
        this.end_game(false);
        break;
    }

    this.check_win();
  }
  check_win() {
    if(this.flagged == this.num_bombs && this.false_flagged == 0) {
      console.log("YOU WIN");
      this.game_over = true;
    }
  }
 

}
function flag_cell(id, col, row) {
  $(id + " #cell-" + col + "-" + row).addClass('flagged');
  $(id + " #cell-" + col + "-" + row).removeClass('blank');
}
function unflag_cell(id, col, row) {
  $(id + " #cell-" + col + "-" + row).addClass('blank');
  $(id + " #cell-" + col + "-" + row).removeClass('flagged');
}
function open_cell(id, col, row, bomb, number) {
  $(id + " #cell-" + col + "-" + row).removeClass('blank');
  if(bomb) {
    $(id + " #cell-" + col + "-" + row).addClass('bomb');
  } else {
    $(id + " #cell-" + col + "-" + row).addClass('nobomb').html(number);
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
