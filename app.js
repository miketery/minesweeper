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
    this.total_cells = cols * rows;
    this.num_bombs = Math.floor(this.total_cells * difficulty);
    this.flagged = 0;
    this.false_flagged = 0;
    this.opened = 0;
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
    var row = parseInt($(cell).attr('row'));
    var col = parseInt($(cell).attr('col'));
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
    for(var i = 0; i < this.rows; i++) 
      this.state[i] = new Array(this.cols).fill(this.state_enum.CLOSED_NOBOMB);
    //randomely assign bombs
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
    console.log("Number of bombs being populated: " + bomb_population);
  }

  //MAINLY FOR FLAGGING AND UNFLAGGING
  right_click(cell) {
    if(this.game_over) {
      return;
    }
    var [row,col] = this.get_coordinates(cell);
    console.log("Right click at:" + row + ", " + col);
    switch(this.state[row][col]) {
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
    this.check_win(); 
  }

  //FOR OPENING CELLS
  left_click(cell) {
    if(this.game_over)
      return;
    var [row, col] = this.get_coordinates(cell);
    console.log("Left click at:" + row + ", " + col);
    switch(this.state[row][col]) {
      case this.state_enum.CLOSED_NOBOMB:
        this.state[row][col] = this.state_enum.OPEN_NOBOMB;
        var num = this.nearby_count_and_open(row, col);
        open_cell(this.id, row, col, false, num);
        this.opened++;
        break;
      case this.state_enum.CLOSED_BOMB:
        open_cell(this.id, row, col, true);
        this.lose()
        break;
    }
    this.check_win();
  }
  check_win() {
    if(this.flagged == this.num_bombs && this.false_flagged == 0)
      this.win()
    else if(this.opened + this.num_bombs == this.total_cells)
      this.win();
  }
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
