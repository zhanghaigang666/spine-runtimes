module spine.webgl {
    export class Mesh implements Disposable {        
        private _vertices:Float32Array;
        private _verticesBuffer: WebGLBuffer;
        private _verticesLength: number = 0;
        private _dirtyVertices: boolean = false;
        private _indices:Uint16Array;
        private _indicesBuffer: WebGLBuffer;
        private _indicesLength: number = 0;
        private _dirtyIndices: boolean = false;
        private _elementsPerVertex: number = 0;        

        attributes(): VertexAttribute[] { return this._attributes; }        
        
        maxVertices(): number { return this._vertices.length / this._elementsPerVertex; }
        numVertices(): number { return this._verticesLength / this._elementsPerVertex; }
        setVerticesLength(length: number) {
            this._dirtyVertices = true;
            this._verticesLength = length;
        }
        vertices(): Float32Array { return this._vertices; }

        maxIndices(): number { return this._indices.length; }
        numIndices(): number { return this._indicesLength; }
        setIndicesLength(length: number) {
            this._dirtyIndices = true;
            this._indicesLength = length;
        }
        indices(): Uint16Array { return this._indices };
        
        constructor(private _attributes: VertexAttribute[], maxVertices: number, maxIndices: number) {
            this._elementsPerVertex = 0;            
            for (var i = 0; i < _attributes.length; i++) {
                this._elementsPerVertex += _attributes[i].numElements;
            }
            this._vertices = new Float32Array(maxVertices * this._elementsPerVertex);
            this._indices = new Uint16Array(maxIndices);          
        }

        setVertices(vertices: Array<number>) {
            this._dirtyVertices = true;
            if (vertices.length > this._vertices.length) throw Error("Mesh can't store more than " + this.maxVertices() + " vertices");
            this._vertices.set(vertices, 0);
            this._verticesLength = vertices.length;                        
        }

        setIndices(indices: Array<number>) {
            this._dirtyIndices = true;
            if (indices.length > this._indices.length) throw Error("Mesh can't store more than " + this.maxIndices() + " indices");
            this._indices.set(indices, 0);
            this._indicesLength = indices.length;                                    
        }

        draw(shader: Shader, primitiveType: number) {
            this.drawWithOffset(shader, primitiveType, 0, this._indicesLength > 0? this._indicesLength: this._verticesLength);
        }

        drawWithOffset(shader: Shader, primitiveType: number, offset: number, count: number) {
            if (this._dirtyVertices || this._dirtyIndices) this.update();                            
            this.bind(shader);
            if (this._indicesLength > 0) gl.drawElements(primitiveType, count, gl.UNSIGNED_SHORT, offset * 2);
            else gl.drawArrays(primitiveType, offset, count);
            this.unbind(shader);                  
        }

        bind(shader: Shader) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this._verticesBuffer);
            var offset = 0;
            for (var i = 0; i < this._attributes.length; i++) {
                let attrib = this._attributes[i];
                let location = shader.getAttributeLocation(attrib.name);
                gl.enableVertexAttribArray(location);
                gl.vertexAttribPointer(location, attrib.numElements, gl.FLOAT, false, this._elementsPerVertex * 4, offset * 4);
                offset += attrib.numElements;
            }
            if (this._indicesLength > 0) gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indicesBuffer);
        }

        unbind(shader: Shader) {
            for (var i = 0; i < this._attributes.length; i++) {
                let attrib = this._attributes[i];
                let location = shader.getAttributeLocation(attrib.name);
                gl.disableVertexAttribArray(location);
            }
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            if (this._indicesLength > 0) gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        }

        private update() {
            if (this._dirtyVertices) {
                if (!this._verticesBuffer) {
                    this._verticesBuffer = gl.createBuffer();                    
                }
                gl.bindBuffer(gl.ARRAY_BUFFER, this._verticesBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, this._vertices.subarray(0, this._verticesLength), gl.STATIC_DRAW);
                this._dirtyVertices = false;               
            }

            if (this._dirtyIndices) {
                if (!this._indicesBuffer) {
                    this._indicesBuffer = gl.createBuffer();                    
                }
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indicesBuffer);
                gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this._indices.subarray(0, this._indicesLength), gl.STATIC_DRAW);
                this._dirtyIndices = false;
            }
        }

        dispose() {
            gl.deleteBuffer(this._verticesBuffer);
            gl.deleteBuffer(this._indicesBuffer);
        }
    }

    export class VertexAttribute {      
        constructor(public name: string, public type: VertexAttributeType, public numElements: number) { }
    }

    export class Position2Attribute extends VertexAttribute {
        constructor() {
            super(Shader.POSITION, VertexAttributeType.Float, 2);
        }
    }

    export class Position3Attribute extends VertexAttribute {
        constructor() {
            super(Shader.POSITION, VertexAttributeType.Float, 3);
        }
    }

    export class TexCoordAttribute extends VertexAttribute {
        constructor(unit: number = 0) {
            super(Shader.TEXCOORDS + (unit == 0? "": unit), VertexAttributeType.Float, 2);
        }
    }

    export class ColorAttribute extends VertexAttribute {
        constructor() {
            super(Shader.COLOR, VertexAttributeType.Float, 4);
        }
    }

    export enum VertexAttributeType {
        Float
    }
}