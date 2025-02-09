/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/**
 * A writer which automatically writes to the given output stream with arbitrary
 * binary data, supplied as ArrayBuffers.
 * 
 * @constructor
 * @param {!OutputStream} stream
 *     The stream that data will be written to.
 */
function ArrayBufferWriter(stream) {

    /**
     * Reference to this ArrayBufferWriter.
     *
     * @private
     * @type {!ArrayBufferWriter}
     */
    var guac_writer = this;

    // Simply call onack for acknowledgements
    stream.onack = function(status) {
        if (guac_writer.onack)
            guac_writer.onack(status);
    };

    /**
     * Encodes the given data as base64, sending it as a blob. The data must
     * be small enough to fit into a single blob instruction.
     * 
     * @private
     * @param {!Uint8Array} bytes
     *     The data to send.
     */
    function __send_blob(bytes) {

        var binary = "";

        // Produce binary string from bytes in buffer
        for (var i=0; i<bytes.byteLength; i++)
            binary += String.fromCharCode(bytes[i]);

        // Send as base64
        stream.sendBlob(window.btoa(binary));

    }

    /**
     * The maximum length of any blob sent by this ArrayBufferWriter,
     * in bytes. Data sent via
     * [sendData()]{@link ArrayBufferWriter#sendData} which exceeds
     * this length will be split into multiple blobs. As the Guacamole protocol
     * limits the maximum size of any instruction or instruction element to
     * 8192 bytes, and the contents of blobs will be base64-encoded, this value
     * should only be increased with extreme caution.
     *
     * @type {!number}
     * @default {@link ArrayBufferWriter.DEFAULT_BLOB_LENGTH}
     */
    this.blobLength = ArrayBufferWriter.DEFAULT_BLOB_LENGTH;

    /**
     * Sends the given data.
     * 
     * @param {!(ArrayBuffer|TypedArray)} data
     *     The data to send.
     */
    this.sendData = function(data) {

        var bytes = new Uint8Array(data);

        // If small enough to fit into single instruction, send as-is
        if (bytes.length <= guac_writer.blobLength)
            __send_blob(bytes);

        // Otherwise, send as multiple instructions
        else {
            for (var offset=0; offset<bytes.length; offset += guac_writer.blobLength)
                __send_blob(bytes.subarray(offset, offset + guac_writer.blobLength));
        }

    };

    /**
     * Signals that no further text will be sent, effectively closing the
     * stream.
     */
    this.sendEnd = function() {
        stream.sendEnd();
    };

    /**
     * Fired for received data, if acknowledged by the server.
     * @event
     * @param {!Status} status
     *     The status of the operation.
     */
    this.onack = null;

};

/**
 * The default maximum blob length for new ArrayBufferWriter
 * instances.
 *
 * @constant
 * @type {!number}
 */
ArrayBufferWriter.DEFAULT_BLOB_LENGTH = 6048;

export { ArrayBufferWriter };
