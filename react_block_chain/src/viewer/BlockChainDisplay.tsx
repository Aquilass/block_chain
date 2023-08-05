// @ts-nocheck
import React, { useState } from "react";
import BlockChain from "../components/BlockChain";

function BlockChainDisplay() {
  return (
    <>
      <h1>Block Chain Visualization</h1>
      <div className="card">
        <BlockChain />
      </div>
    </>
  );
}

export default BlockChainDisplay;
