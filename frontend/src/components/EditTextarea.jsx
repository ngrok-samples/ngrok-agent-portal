import React from "react";
import { Paper, Popper, TextField } from "@mui/material";
import { useGridApiContext } from "@mui/x-data-grid";
export default function EditTextarea(props) {
  const { id, field, value, colDef, hasFocus } = props;
  const [valueState, setValueState] = React.useState(value || "");
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [inputRef, setInputRef] = React.useState(null);
  const apiRef = useGridApiContext();
  React.useLayoutEffect(() => {
    if (hasFocus && inputRef) {
      //console.log(inputRef);
      inputRef.focus();
    }
  }, [hasFocus, inputRef]);

  const handleRef = React.useCallback((el) => {
    setAnchorEl(el);
  }, []);

  const handleChange = React.useCallback(
    (event) => {
      const newValue = event.target.value;
      setValueState(newValue);
      apiRef.current.setEditCellValue(
        { id, field, value: newValue, debounceMs: 200 },
        event
      );
    },
    [apiRef, field, id]
  );
  return (
    <div style={{ position: "relative", alignSelf: "flex-start" }}>
      <div
        ref={handleRef}
        id={id}
        style={{
          height: 1,
          width: colDef.computedWidth,
          display: "block",
          position: "absolute",
          top: 0,
        }}
      />
      {anchorEl && (
        <Popper
          open
          anchorEl={anchorEl}
          placement='bottom-start'
          sx={{
            width: colDef
              ? // colDef.computedWidth if you want input to take cell width
                "fit-content"
              : "unset",
            zIndex: 1300,
          }}
        >
          <Paper
            elevation={1}
            sx={{ p: 1, width: "100%", minWidth: colDef.computedWidth }}
          >
            <TextField
              fullWidth
              variant='outlined'
              // multiline
              // rows={4}
              // maxRows={20}
              InputProps={{
                rows: props.singleLine ? undefined : 4,
                multiline: props.singleLine ? false : true,
                inputComponent: props.singleLine ? undefined : "textarea",
              }}
              //defaultValue={valueState}
              value={valueState}
              sx={{
                textarea: props.singleLine ? {} : { resize: "vertical" },
                //width: colDef.computedWidth, //if you want input to take cell width
                ".MuiOutlinedInput-root": {
                  p: 0,
                },
                ".MuiOutlinedInput-root fieldset": {
                  border: 0,
                },
                "&:hover .MuiOutlinedInput-root fieldset": {
                  border: 0,
                },
                ".MuiOutlinedInput-root.Mui-focused fieldset": {
                  border: 0,
                },
              }}
              onChange={handleChange}
              inputRef={setInputRef}
              onKeyUp={(e) => {
                if (e.key === "Enter") {
                  e.stopPropagation();
                }
              }}
              onFocus={(e) => {
                e.target.selectionStart = valueState.length;
              }}
            />
          </Paper>
        </Popper>
      )}
    </div>
  );
}
