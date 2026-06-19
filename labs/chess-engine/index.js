'use strict';
/**
 * Chess Engine — محرك الشطرنج السيادي
 * تم توليده بواسطة سرب: ui-synthesizer + quantum-debugger + security-audit
 * تاريخ التوليد: 2026-06-12T05:52:47.836Z
 */
const BOARD_SIZE = 8;
const PIECES = { K:'♔', Q:'♕', R:'♖', B:'♗', N:'♘', P:'♙', k:'♚', q:'♛', r:'♜', b:'♝', n:'♞', p:'♟' };

function initBoard() {
  const b = Array(8).fill(null).map(() => Array(8).fill(null));
  // الصف الأول (أسود)
  b[0] = ['r','n','b','q','k','b','n','r'];
  b[1] = Array(8).fill('p');
  // الصف الأخير (أبيض)
  b[7] = ['R','N','B','Q','K','B','N','R'];
  b[6] = Array(8).fill('P');
  return b;
}

function boardToString(board) {
  return board.map((row, i) =>
    `${8 - i} ` + row.map(p => PIECES[p] || '·').join(' ')
  ).join('\n') + '\n  a b c d e f g h';
}

module.exports = { BOARD_SIZE, PIECES, initBoard, boardToString };

// تشغيل مباشر
if (require.main === module) {
  const board = initBoard();
  console.log('\n♟️  لوحة الشطرنج السيادية:\n');
  console.log(boardToString(board));
}
