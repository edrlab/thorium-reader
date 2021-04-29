import { buffers, channel } from "@redux-saga/core";
import { Operation } from "rfc6902";

export const patchChannel = channel<Operation>(buffers.expanding(1000));