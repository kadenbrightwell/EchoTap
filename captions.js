// Converts [0..3] sequence into simple vocalization strings like "ta ta TA tu"
const SYLL = ['ta','ti','tu','to'];
export const makeCaption = (sequence)=> sequence.map(i=>SYLL[i]).join(' ');
