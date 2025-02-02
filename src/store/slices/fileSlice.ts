import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
const BASE_URL = import.meta.env.VITE_BASE_URL;

interface Folder {
  name: string;
  createdDate: string;
}

interface FileState {
  folders: Folder[];
  loading: boolean;
  error: string | null;
  mergedVideoKey: string | null;
  mergeLoading: boolean;
  mergeError: string | null;
}

const initialState: FileState = {
  folders: [],
  loading: false,
  error: null,
  mergedVideoKey: null,
  mergeLoading: false,
  mergeError: null,
};

// Async thunk for fetching folders
export const fetchFolders = createAsyncThunk(
  'file/fetchFolders',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${BASE_URL}/files/folders`, {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(error.response?.data?.message || 'Failed to fetch folders');
      }
      return rejectWithValue('An unexpected error occurred');
    }
  }
);

export const fetchMergedVideo = createAsyncThunk(
  'file/fetchMergedVideo',
  async (folderId: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${BASE_URL}/merge/${folderId}`, {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(error.response?.data?.message || 'Failed to fetch merged video');
      }
      return rejectWithValue('An unexpected error occurred');
    }
  }
);

export const deleteFolder = createAsyncThunk(
  'file/deleteFolder',
  async (folderId: string, { rejectWithValue }) => {
    try {
      const response = await axios.delete(`${BASE_URL}/delete/folders/${folderId}`, {
        withCredentials: true
      });
      return folderId;
    } catch (error) {
      return rejectWithValue('Failed to delete recording');
    }
  }
);

const fileSlice = createSlice({
  name: 'file',
  initialState,
  reducers: {
    clearFolders: (state) => {
      state.folders = [];
    },
    clearMergedVideo: (state) => {
      state.mergedVideoKey = null;
      state.mergeError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFolders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFolders.fulfilled, (state, action) => {
        state.loading = false;
        state.folders = action.payload.folders;
        state.error = null;
      })
      .addCase(fetchFolders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchMergedVideo.pending, (state) => {
        state.mergeLoading = true;
        state.mergeError = null;
      })
      .addCase(fetchMergedVideo.fulfilled, (state, action) => {
        state.mergeLoading = false;
        state.mergedVideoKey = action.payload.key;
        state.mergeError = null;
      })
      .addCase(fetchMergedVideo.rejected, (state, action) => {
        state.mergeLoading = false;
        state.mergeError = action.payload as string;
      })
      .addCase(deleteFolder.fulfilled, (state, action) => {
        state.folders = state.folders.filter(folder => folder.name !== action.payload);
      })
      .addCase(deleteFolder.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { clearFolders, clearMergedVideo } = fileSlice.actions;
export default fileSlice.reducer; 