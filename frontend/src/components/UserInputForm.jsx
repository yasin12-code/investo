import React, { useState } from 'react';
import { MapPin, Wallet, Target, Shield, Clock, Sparkles } from 'lucide-react';
import { formatCurrencyFull } from '../utils/formatters';
import './UserInputForm.css';

const RETURN_OPTIONS = [5, 10, 15, 20, 25];
const RISK_OPTIONS = ['Conservative', 'Moderate', 'Aggressive'];
const HORIZON_OPTIONS = [1, 3, 5, 7, 10];

export default function UserInputForm({ onSubmit }) {
  const [location, setLocation] = useState('Lahore');
  const [budget, setBudget] = useState(50000000);
  const [targetReturn, setTargetReturn] = useState(15);
  const [riskTolerance, setRiskTolerance] = useState('Moderate');
  const [timeHorizon, setTimeHorizon] = useState(5);
  const [errors, setErrors] = useState({});

  const handleBudgetSlider = (e) => {
    setBudget(Number(e.target.value));
  };

  const handleBudgetInput = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setBudget(Number(val) || 0);
  };

  const validate = () => {
    const newErrors = {};
    if (!location.trim()) newErrors.location = 'Location is required';
    if (budget < 1000000) newErrors.budget = 'Minimum budget is PKR 10 Lac';
    if (budget > 1000000000) newErrors.budget = 'Maximum budget is PKR 100 Cr';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({ location, budget, targetReturn, riskTolerance, timeHorizon });
  };

  return (
    <form className="user-input-form animate-fade-in-up" onSubmit={handleSubmit}>
      <div className="form-header">
        <h2>Investment Profile</h2>
        <p>Tell us about your investment goals</p>
      </div>

      {/* Location */}
      <div className={`form-group ${errors.location ? 'has-error' : ''}`}>
        <label className="form-label">
          <MapPin size={16} />
          <span>Location</span>
        </label>
        <div className="input-wrapper">
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="location-select"
          >
            <option value="Karachi">Karachi</option>
            <option value="Lahore">Lahore</option>
            <option value="Islamabad">Islamabad</option>
          </select>
        </div>
        {errors.location && <span className="form-error">{errors.location}</span>}
      </div>

      {/* Budget */}
      <div className={`form-group ${errors.budget ? 'has-error' : ''}`}>
        <label className="form-label">
          <Wallet size={16} />
          <span>Investment Budget</span>
        </label>
        <div className="budget-display">{formatCurrencyFull(budget)}</div>
        <div className="input-wrapper">
          <input
            type="text"
            value={budget.toLocaleString('en-PK')}
            onChange={handleBudgetInput}
            placeholder="Enter budget in PKR"
          />
        </div>
        <div className="slider-wrapper">
          <input
            type="range"
            min={1000000}
            max={100000000}
            step={1000000}
            value={budget}
            onChange={handleBudgetSlider}
            className="budget-slider"
          />
          <div className="slider-labels">
            <span>PKR 10 Lac</span>
            <span>PKR 10 Cr</span>
          </div>
        </div>
        {errors.budget && <span className="form-error">{errors.budget}</span>}
      </div>

      {/* Target Return */}
      <div className="form-group">
        <label className="form-label">
          <Target size={16} />
          <span>Target Annual Return</span>
        </label>
        <div className="option-pills">
          {RETURN_OPTIONS.map((r) => (
            <button
              key={r}
              type="button"
              className={`pill ${targetReturn === r ? 'active' : ''}`}
              onClick={() => setTargetReturn(r)}
            >
              {r}%
            </button>
          ))}
        </div>
      </div>

      {/* Risk Tolerance */}
      <div className="form-group">
        <label className="form-label">
          <Shield size={16} />
          <span>Risk Tolerance</span>
        </label>
        <div className="risk-toggles">
          {RISK_OPTIONS.map((r) => (
            <button
              key={r}
              type="button"
              className={`risk-toggle ${riskTolerance === r ? 'active' : ''} ${r.toLowerCase()}`}
              onClick={() => setRiskTolerance(r)}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Time Horizon */}
      <div className="form-group">
        <label className="form-label">
          <Clock size={16} />
          <span>Investment Horizon</span>
        </label>
        <div className="option-pills">
          {HORIZON_OPTIONS.map((y) => (
            <button
              key={y}
              type="button"
              className={`pill ${timeHorizon === y ? 'active' : ''}`}
              onClick={() => setTimeHorizon(y)}
            >
              {y} {y === 1 ? 'yr' : 'yrs'}
            </button>
          ))}
        </div>
      </div>

      {/* Submit */}
      <button type="submit" className="submit-btn">
        <Sparkles size={18} />
        <span>Analyze Investment Opportunities</span>
      </button>
    </form>
  );
}
