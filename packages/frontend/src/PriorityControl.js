import React from 'react';
import { FormControlLabel, Radio, RadioGroup } from '@mui/material';

export const PRIORITIES = ['P1', 'P2', 'P3'];

function PriorityControl({ value, onChange, label, disabled = false }) {
  return (
    <RadioGroup
      row
      aria-label={label}
      value={value}
      onChange={event => onChange(event.target.value)}
      className="priority-control"
    >
      {PRIORITIES.map(priority => (
        <FormControlLabel
          key={priority}
          value={priority}
          label={priority}
          disabled={disabled}
          control={<Radio />}
          className={`priority-option${value === priority ? ' is-selected' : ''}`}
        />
      ))}
    </RadioGroup>
  );
}

export default PriorityControl;