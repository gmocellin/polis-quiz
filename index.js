const _ = require('lodash');
const fs = require('fs');
const moment = require('moment-timezone');

const interactionsString = fs.readFileSync('input.json', 'utf8');
const interactions = JSON.parse(interactionsString);

const canvassersInteractions = _.groupBy(interactions, 'meta.createdBy');

let fraudulentCanvassers = [];

// - Canvassers only knock doors between the hours of 9am and 9pm local time
_.forEach(canvassersInteractions, (interactions, key) => {
  const foundInteractions = _.find(interactions, (interaction) => {
    const interactionTime = moment(interaction.meta.created);
    const beforeTime = moment(interactionTime).hour('9').startOf('hour');
    const afterTime = moment(interactionTime).hour('21').startOf('hour');
    return !moment(interactionTime).isBetween(beforeTime, afterTime);
  });
  if (!_.isEmpty(foundInteractions)) {
    fraudulentCanvassers.push(key);
  }
});

// - Canvassers should be less than 0.3 miles away from the contact with whom they are speaking
_.forEach(canvassersInteractions, (interactions, key) => {
  const foundInteractions = _.find(interactions, (interaction) => {
    return interaction.data.distance > 0.3;
  });
  if (!_.isEmpty(foundInteractions)) {
    fraudulentCanvassers.push(key);
  }
});


// - Given the typical duration of conversations between canvassers and contacts, canvassers should knock no more than 4 doors an
// hour if they mark the `contact` as `available`
_.forEach(canvassersInteractions, (interactions, key) => {
  const foundInteractions = [];
  let availableInteractions = [];
  _.forEach(interactions, (interaction) => {
    if (interaction.data.available) {
      availableInteractions.push(interaction);
    }
  });
  availableInteractions = _.sortBy(availableInteractions, 'meta.created');

  _.forEach(availableInteractions, (interaction, index) => {
    const firstInteraction = moment(interaction.meta.created);
    let fourthInteraction = availableInteractions[index+3];
    if (fourthInteraction) {
      fourthInteraction = moment(fourthInteraction.meta.created);

      const difference = fourthInteraction.diff(firstInteraction);
      const hours = moment.duration(difference).hours();

      if (hours < 1) {
        foundInteractions.push(interaction);
      }
    }
  });

  if (!_.isEmpty(foundInteractions)) {
    fraudulentCanvassers.push(key);
  }
});

fraudulentCanvassers = _.uniq(fraudulentCanvassers);

fs.writeFile('output.json', JSON.stringify(fraudulentCanvassers), function (err) {
  if (err) throw err;
  console.log('Saved!');
});
