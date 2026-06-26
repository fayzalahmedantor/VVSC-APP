# Project Guidelines

## Language Settings
- **Implementation Plans**: **ALWAYS** write the `implementation_plan.md` in Bengali (বাংলা). The user prefers all plans and documentation aimed at them to be in Bengali.

## UI and Components

### Dropdowns / Select Boxes
Whenever you create or modify a `<select>` dropdown in this project, **always** ensure that the placeholder option (e.g. "Select Category", "Select Product Name") is disabled and hidden so that it doesn't appear as a selectable option in the dropdown list when it is opened. 

Example:
```jsx
// CORRECT
<select>
  <option value="" disabled hidden>Select an option...</option>
  <option value="1">Option 1</option>
</select>

// INCORRECT
<select>
  <option value="">Select an option...</option>
  <option value="1">Option 1</option>
</select>
```

## App Branding Rule
The official name of this software application is **VVSC APP**.
Do not use placeholder names like "ManagePro" or generic titles. Whenever referencing the application name in code, UI elements, or text, always use "VVSC APP" unless explicitly asked otherwise by the user.
