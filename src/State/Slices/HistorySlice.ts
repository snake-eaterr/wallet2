import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import * as Types from '../../Api/autogenerated/ts/types'
type SourceOperations = Record<string /*nprofile*/, Types.UserOperation[]>
type Cursor = Partial<Types.GetUserOperationsRequest>
interface History {
  operations?: SourceOperations
  cursor?: Cursor
  latestOperation?: Partial<Types.UserOperation>
};

const historyLocal = localStorage.getItem("history");

const update = (value: History) => {
  const save = JSON.stringify(value)
  localStorage.setItem("history", save);
}

const initialState: History = JSON.parse(historyLocal ?? "{}");
// const ops: SourceOperations = {}
// Object.entries(initialState.operations || {}).forEach(([k, o]) => {
//   if (!Array.isArray(o)) {
//     ops[k] = Object.values(o) || []
//   }
// })
// initialState.operations = ops

const historySlice = createSlice({
  name: 'history',
  initialState,
  reducers: {
    setSourceHistory: (state, action: PayloadAction<{ nprofile: string, operations: Types.UserOperation[], cursor: Cursor }>) => {
      const { nprofile, operations, cursor } = action.payload
      if (!state.operations) {
        state.operations = {}
      }
      state.operations[nprofile] = [ ...operations ]
      state.cursor = { ...cursor }
      update(state)
    },
    setLatestOperation: (state, action: PayloadAction<{ operation: Types.UserOperation }>) => {
      const { operation } = action.payload
      state.latestOperation = { ...operation }
      update(state)
    },
  },
});

export const { setSourceHistory, setLatestOperation } = historySlice.actions;
export default historySlice.reducer;
