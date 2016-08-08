module spine {
    export class TransformConstraint implements Updatable {
        data: TransformConstraintData;
        bones: Array<Bone>;
        target: Bone;
        rotateMix = 0; translateMix = 0; scaleMix = 0; shearMix = 0;
        temp = new Vector2();   

        constructor (data: TransformConstraintData, skeleton: Skeleton) {
            if (data == null) throw new Error("data cannot be null.");
            if (skeleton == null) throw new Error("skeleton cannot be null.");
            this.data = data;
            this.rotateMix = data.rotateMix;
            this.translateMix = data.translateMix;
            this.scaleMix = data.scaleMix;
            this.shearMix = data.shearMix;
            this.bones = new Array<Bone>();
            for (var i = 0; i < data.bones.length; i++)            
                this.bones.push(skeleton.findBone(data.bones[i].name));
            this.target = skeleton.findBone(data.target.name);
        }

        apply () {
            this.update();
        }

        update () {
            let rotateMix = this.rotateMix, translateMix = this.translateMix, scaleMix = this.scaleMix, shearMix = this.shearMix;
            let target = this.target;
            let ta = target.a, tb = target.b, tc = target.c, td = target.d;
            let bones = this.bones;
            for (var i = 0, n = bones.length; i < n; i++) {
                let bone = bones[i];

                if (rotateMix > 0) {
                    let a = bone.a, b = bone.b, c = bone.c, d = bone.d;
                    let r = Math.atan2(tc, ta) - Math.atan2(c, a) + this.data.offsetRotation * MathUtils.degRad;
                    if (r > MathUtils.PI)
                        r -= MathUtils.PI2;
                    else if (r < -MathUtils.PI) r += MathUtils.PI2;
                    r *= rotateMix;
                    let cos = Math.cos(r), sin = Math.sin(r);
                    bone.a = cos * a - sin * c;
                    bone.b = cos * b - sin * d;
                    bone.c = sin * a + cos * c;
                    bone.d = sin * b + cos * d;
                }

                if (translateMix > 0) {
                    let temp = this.temp;
                    target.localToWorld(temp.set(this.data.offsetX, this.data.offsetY));
                    bone.worldX += (temp.x - bone.worldX) * translateMix;
                    bone.worldY += (temp.y - bone.worldY) * translateMix;
                }

                if (scaleMix > 0) {
                    let bs = Math.sqrt(bone.a * bone.a + bone.c * bone.c);
                    let ts = Math.sqrt(ta * ta + tc * tc);
                    var s = bs > 0.00001 ? (bs + (ts - bs + this.data.offsetScaleX) * scaleMix) / bs : 0;
                    bone.a *= s;
                    bone.c *= s;
                    bs = Math.sqrt(bone.b * bone.b + bone.d * bone.d);
                    ts = Math.sqrt(tb * tb + td * td);
                    s = bs > 0.00001 ? (bs + (ts - bs + this.data.offsetScaleY) * scaleMix) / bs : 0;
                    bone.b *= s;
                    bone.d *= s;
                }

                if (shearMix > 0) {
                    let b = bone.b, d = bone.d;
                    let by = Math.atan2(d, b);
                    let r = Math.atan2(td, tb) - Math.atan2(tc, ta) - (by - Math.atan2(bone.c, bone.a));
                    if (r > MathUtils.PI)
                        r -= MathUtils.PI2;
                    else if (r < -MathUtils.PI) r += MathUtils.PI2;
                    r = by + (r + this.data.offsetShearY * MathUtils.degRad) * shearMix;
                    let s = Math.sqrt(b * b + d * d);
                    bone.b = Math.cos(r) * s;
                    bone.d = Math.sin(r) * s;
                }
            }
        }        
    }
}