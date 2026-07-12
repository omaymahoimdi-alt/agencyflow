import { Schema, model, models } from "mongoose";

const DataStoreSchema = new Schema({
  key: { type: String, required: true, unique: true, index: true },
  value: { type: Schema.Types.Mixed, required: true },
}, { timestamps: true });

const DataStore = models.DataStore || model("DataStore", DataStoreSchema);

export default DataStore;
