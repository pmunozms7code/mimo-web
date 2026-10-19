import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// Original procedural characters. Every part is owned by the scene's resource registry.
export function buildCharacter(kind, { mesh, mat, group }) {
  const physical = (color, roughness = .32, metalness = .05) =>
    mat(new THREE.MeshPhysicalMaterial({ color, roughness, metalness, clearcoat: .7, clearcoatRoughness: .32 }));
  const sphere = (r, m, parent, pos, scale = [1, 1, 1]) =>
    mesh(new THREE.SphereGeometry(r, 48, 32), m, parent, pos, scale);
  const capsule = (r, l, m, parent, pos) =>
    mesh(new THREE.CapsuleGeometry(r, l, 8, 24), m, parent, pos);
  const box = (w, h, d, r, m, parent, pos) =>
    mesh(new RoundedBoxGeometry(w, h, d, 4, r), m, parent, pos);

  const head = new THREE.Group();
  group.add(head);
  const eyes = [], ears = [], arms = [];

  if (kind === 'mimo') {
    const honey  = physical(0xffc329, .3);
    const cream  = physical(0xffeac7, .38);
    const rose   = physical(0xd93158, .44);
    const ink    = physical(0x211d28, .13);
    const glint  = mat(new THREE.MeshBasicMaterial({ color: 0xfff9e8 }));

    head.position.y = .5;
    sphere(1.13, honey, head, [0, 0, 0], [1.04, .92, .86]);

    for (const side of [-1, 1]) {
      const ear = new THREE.Group();
      ear.position.set(side * .67, .75, -.06);
      head.add(ear);
      ear.rotation.z = side * -.16;
      ears.push(ear);

      capsule(.245, .71, honey, ear, [0, .37, 0]);
      const innerEar = capsule(.115, .49, rose, ear, [0, .37, .242]);
      innerEar.scale.z = .16;

      sphere(.43, cream, head, [side * .31, -.34, .78], [1, .72, .4]);
      const eye = sphere(.17, ink, head, [side * .43, .09, .865], [.82, 1.2, .6]);
      eyes.push(eye);
      sphere(.047, glint, eye, [-.03, .04, .092], [1, 1, .3]);
      sphere(.12, rose, head, [side * .77, -.26, .74], [1, .52, .12]);
    }

    sphere(.12, ink, head, [0, -.27, .956], [1, .65, .62]);
    const smile = mesh(new THREE.TorusGeometry(.13, .018, 8, 32, Math.PI), ink, head, [0, -.37, .943]);
    smile.rotation.z = Math.PI;

    sphere(.78, honey, group, [0, -.96, -.09], [.89, 1.14, .77]);
    sphere(.54, cream, group, [0, -1.05, .42], [.83, 1.1, .22]);
    mesh(new THREE.TorusGeometry(.49, .17, 16, 64), rose, group, [0, -.46, .01]).rotation.x = Math.PI / 2;
    const scarf = box(.26, .7, .12, .09, rose, group, [.38, -.8, .52]);
    scarf.rotation.z = .23;

    for (const side of [-1, 1]) {
      const arm = new THREE.Group();
      arm.position.set(side * .58, -.68, 0);
      group.add(arm);
      arms.push(arm);
      capsule(.22, .42, honey, arm, [side * .12, -.27, .08]).rotation.z = side * .35;
      sphere(.32, honey, group, [side * .44, -1.74, .17], [1.1, .7, 1.35]);
    }

    group.rotation.set(0, -.13, -.055);

  } else {
    // kiro
    const shell = physical(0xcbd0bb, .29, .32);
    const dark  = physical(0x101b22, .27, .38);
    const lime  = physical(0xd2ff32, .3, .2);
    const joint = physical(0x373f42, .54, .3);
    const eyeMat = mat(new THREE.MeshBasicMaterial({ color: 0xe2ff93 }));

    head.position.y = .66;
    sphere(1.13, shell, head, [0, 0, 0], [1, 1, .93]);
    sphere(1.0, joint, head, [0, -.07, .49], [1, .79, .63]);
    sphere(.94, dark, head, [0, -.06, .59], [1, .77, .61]);

    for (const side of [-1, 1]) {
      const eye = capsule(.065, .15, eyeMat, head, [side * .34, -.035, 1.18]);
      eyes.push(eye);
      const hinge = mesh(new THREE.CylinderGeometry(.29, .29, .15, 40), joint, head, [side * 1.09, -.08, 0]);
      hinge.rotation.z = Math.PI / 2;
      const cap = mesh(new THREE.CylinderGeometry(.21, .21, .18, 40), lime, head, [side * 1.14, -.08, 0]);
      cap.rotation.z = Math.PI / 2;
    }

    box(.3, .075, .055, .025, lime, head, [0, .87, .62]);
    capsule(.025, .38, joint, head, [-.83, 1.01, -.15]).rotation.z = .24;
    sphere(.065, lime, head, [-.89, 1.22, -.15]);
    box(1.33, 1.25, .7, .2, joint, group, [0, -.83, -.55]);

    for (const side of [-1, 1]) {
      capsule(.22, .7, shell, group, [side * .77, -.85, -.43]);
      mesh(new THREE.CylinderGeometry(.17, .22, .2, 24), lime, group, [side * .77, -1.39, -.43]);
    }

    mesh(new THREE.TorusGeometry(.48, .14, 16, 64), joint, group, [0, -.43, 0]).rotation.x = Math.PI / 2;
    box(1.25, 1.14, .87, .3, shell, group, [0, -1., 0]);
    box(.65, .39, .12, .08, joint, group, [0, -.92, .458]);
    for (let i = 0; i < 3; i++) box(.09, .17, .04, .02, lime, group, [-.18 + i * .18, -.92, .535]);

    for (const side of [-1, 1]) {
      const arm = new THREE.Group();
      arm.position.set(side * .66, -.65, 0);
      arm.rotation.z = side * .27;
      group.add(arm);
      arms.push(arm);
      sphere(.24, joint, arm, [0, 0, 0]);
      capsule(.23, .3, shell, arm, [side * .1, -.28, 0]);
      mesh(new THREE.TorusGeometry(.215, .055, 10, 32), lime, arm, [side * .12, -.54, 0]).rotation.x = Math.PI / 2;
      sphere(.23, shell, arm, [side * .12, -.66, .025], [1, 1.05, 1]);
      capsule(.23, .3, joint, group, [side * .33, -1.62, 0]);
      box(.54, .46, .8, .16, shell, group, [side * .34, -1.93, .14]);
      box(.55, .09, .79, .04, lime, group, [side * .34, -2.14, .14]);
    }

    group.rotation.set(.04, -.2, .12);
  }

  const baseEyes = eyes.map(e => e.position.x);
  return {
    head,
    update(t, p, gesture) {
      head.rotation.set(-p.y * .2, p.x * .36, Math.sin(t * .8) * .025);
      const blink = 1 - Math.pow(Math.max(0, Math.cos(t * 1.1)), 60) * .92;
      eyes.forEach((eye, i) => {
        eye.scale.y = (kind === 'mimo' ? 1.2 : 1) * blink;
        eye.position.x = baseEyes[i] + p.x * .025;
      });
      group.position.y = Math.sin(t * 1.2) * .07 + (kind === 'kiro' ? Math.sin(Math.min(gesture, 1) * Math.PI) * .24 : 0);
      ears.forEach((ear, i) => ear.rotation.z = (i ? -.16 : .16) + Math.sin(t * 1.8 + i) * .045 + Math.sin(gesture * 7) * .12);
      arms.forEach((arm, i) => arm.rotation.z = (i ? 1 : -1) * (.15 + Math.sin(t + i) * .035) + (i === 1 ? Math.sin(gesture * 8) * .4 : 0));
    }
  };
}
