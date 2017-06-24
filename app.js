/*
 * Minesweeper jQuery App
 * Author: Mike Tery
 * Date: 2017-06-21
 */

$(document).ready(function(){
  console.log("Starting application: Minesweepr");

  //Future: make these user defined during game setup
  //configurations
  var cols = 10;
  var rows = 10;
  var difficulty = 0.05; //mine density 0-1
  
  var minefield = new Minefield("#minefield", cols, rows, difficulty);

  minefield.build_minefield();
  minefield.populate_bombs();
  
  //ref: https://stackoverflow.com/questions/1206203/how-to-distinguish-between-left-and-right-mouse-click-with-jquery
  $(".cell").mousedown(function(event) {
    switch (event.which) {
      case 1:
        minefield.left_click(this);
        break;
      case 3:
        minefield.right_click(this);
        break;
      default:
        return;
    }
  });
});

/*
 * Minefield class
 * Used to build the minefield and track the game
 */
class Minefield {
  
  constructor(id, cols, rows, difficulty) {
    // Input configuration for Game setup
    this.id = id;
    this.cols = cols;
    this.rows = rows;
    this.difficulty = difficulty;

    // Game setup
    this.total_cells = cols * rows; // Total cells
    this.num_bombs = Math.floor(this.total_cells * difficulty); //number of bombs
    this.flagged = 0;       // How many cells flagged correctly
    this.false_flagged = 0; // How many cells have been flasely flagged
    this.opened = 0;        // How many cells have been opened
    this.game_over = false; // Used for when the game is over

    // The state each cell/square can take on
    this.state_enum = {
      CLOSED_NOBOMB: 0,
      CLOSED_BOMB: 1,
      OPENED_NOBOMB: 2,
      OPENED_BOMB: 3,
      FLAGGED_NOBOMB: 4,
      FLAGGED_BOMB: 5
    };
  }

  // Given a cell what are its [row, col] coordinates
  get_coordinates(cell) {
    var row = parseInt($(cell).attr('row'));
    var col = parseInt($(cell).attr('col'));
    return [row, col];
  }

  // Draw the minefield as a number of rows, with a number of cells in each row
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

  // Generate state and populate with bombs
  populate_bombs() {
    //construct 2D array to hold state
    this.state = new Array(this.rows);
    for(var i = 0; i < this.rows; i++) 
      this.state[i] = new Array(this.cols).fill(this.state_enum.CLOSED_NOBOMB);

    // Randomely assign bombs
    var bomb_population = 0;
    while(bomb_population < this.num_bombs) {
      var row = getRandomInt(0, this.rows);
      var col = getRandomInt(0, this.cols);
      if(this.state[row][col] == this.state_enum.CLOSED_NOBOMB) {
        this.state[row][col] = this.state_enum.CLOSED_BOMB;
        bomb_population++;
      }
    }
    $('#bomb_population').html(bomb_population);
    console.log("Number of bombs populated: " + bomb_population);
  }

  /*
   * Action when a cell is right clicked
   * this is used for FLAGGING and UNFLAGGING
   * if all bombs are flagged correctly the game is won
   */
  right_click(cell) {
    if(this.game_over)
      return; // no action if the game is over

    var [row,col] = this.get_coordinates(cell);
    console.log("Right click at:" + row + ", " + col);

    // Depending on the state of clicked cell, change its state
    switch(this.state[row][col]) {
      // Closed then flag it, and count towards correctly flagged
      case this.state_enum.CLOSED_BOMB:
        this.state[row][col] = this.state_enum.FLAGGED_BOMB;
        this.flagged++;
        flag_cell(this.id, row, col);
        break;
      // Closed then flag it, and count towards false flagged
      case this.state_enum.CLOSED_NOBOMB:
        this.state[row][col] = this.state_enum.FLAGGED_NOBOMB;
        this.false_flag++;
        flag_cell(this.id, row, col);
        break;
      // Already flagged then unflag it, and decrease count
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
    this.check_win(); 
  }

  /*
   * Action when a cell is left clicked
   * used for opening cells
   */
  left_click(cell) {
    if(this.game_over)
      return; // no action if the game is over

    var [row, col] = this.get_coordinates(cell);
    console.log("Left click at:" + row + ", " + col);

    // Depending on the state of clicked cell, change its state
    switch(this.state[row][col]) {
      // cell is closed and has no bomb, then open it and display number of acjecent bombs
      // if zero adjecent bombs, open all neighbor cells
      case this.state_enum.CLOSED_NOBOMB:
        this.state[row][col] = this.state_enum.OPEN_NOBOMB;
        var num = this.nearby_count_and_open(row, col);
        open_cell(this.id, row, col, false, num);
        this.opened++; // incremenet number of opened cells; used in check_win()
        break;
      // cell is closed and has a bomb, open it, and lose
      case this.state_enum.CLOSED_BOMB:
        open_cell(this.id, row, col, true);
        this.lose()
        break;
    }
    this.check_win();
  }

  /*
   * Check whether game has been won
   * If all bombs correctly flagged and zero false flags -> WIN
   * If all cells openeds with exception of bombs -> WIN
   */
  check_win() {
    if(this.flagged == this.num_bombs && this.false_flagged == 0)
      this.win()
    else if(this.opened + this.num_bombs == this.total_cells)
      this.win();
  }
  
  // Set state to win or lose
  win() {
    console.log("YOU WIN");
    $('#game_state').html('You Win!<br />Refresh to try again');
    this.game_over = true;
  }
  lose() {
    console.log("YOU LOSE");
    $('#game_state').html('You Lose :(<br />Refresh to try again');
    this.game_over = true;
  }

  /*
   * Count how many bombs near specified cell
   * open neighboring cells if count is 0
   */
  nearby_count_and_open(row, col) {
    console.log(row + '-' + col);
    console.log(this.rows + '-' + this.cols);
    var min_row = Math.max(0, row-1);
    var max_row = Math.min(this.rows-1, row+1);
    var min_col = Math.max(0, col-1);
    var max_col = Math.min(this.cols-1, col+1);
    console.log(min_row + '-' + max_row + '-' + min_col + '-' + max_col);
    var count = 0;
    for(var y = min_row; y <= max_row; y++) {
      for(var x = min_col; x <= max_col; x++) {
        if(x != col || y != row) {
          console.log(y+', '+x+': '+this.state[y][x]);
          if(this.state[y][x] == this.state_enum.CLOSED_BOMB || this.state[y][x] == this.state_enum.FLAGGED_BOMB) 
            count++;
        }
      }
    }
    console.log('count: '+count);
    if(count == 0) {
      //open nearby
      for(var y = min_row; y <= max_row; y++) {
        for(var x = min_col; x <= max_col; x++) {
          if(x != col || y != row)
            this.left_click($(this.id + " #cell-" + y + "-" + x));
        }
      }
      return '';
    }
    return count;
  }
}

// CSS classes when cells are flagged/unflagged/opened
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
    $(id + " #cell-" + col + "-" + row).addClass('nobomb').html('<span>'+number+'</span>');
  }
}

//ref: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}
