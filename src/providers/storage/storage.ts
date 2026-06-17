// import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';

@Injectable({
  providedIn: 'root',
})
export class StorageProvider {
  recorridos = [];
  items = [];

  arrayAux: any = [];

  pendientesAgrupados: any[] = [];

  constructor(public storage: Storage) {}

  async init() {
    await this.storage.create();
  }

  getRecorridos() {
    let promise = new Promise((resolve, reject) => {
      this.storage
        .get('recorridos')
        .then((val) => {
          if (val) {
            console.log('Mensaje en consola Los recorridos son->', val);
            this.recorridos = val;
            resolve(this.recorridos);
          } else {
            console.log(
              'Mensaje en consola No habia recorridos se setean en vacío ->',
              val,
            );
            this.recorridos = [];
            this.storage.set('recorridos', this.recorridos).then(() => {
              resolve(this.getRecorridos());
            });
          }
        })
        .catch(() =>
          console.log('Mensaje en consola no se pudo acceder al storage :)'),
        );
    });
    return promise;
  }

  setRecorridos(recorridos: any) {
    let promise = new Promise((resolve, reject) => {
      this.storage
        .set('recorridos', recorridos)
        .then(() => {
          resolve(true);
        })
        .catch(() => {
          reject(false);
        });
    });
    return promise;
  }

  setItems(items: any) {
    console.log(items);

    let promise = new Promise((resolve, reject) => {
      this.storage
        .set('items', items)
        .then(() => {
          resolve(true);
        })
        .catch(() => {
          reject(false);
        });
    });
    return promise;
  }

  getItems() {
    let promise = new Promise((resolve, reject) => {
      this.storage
        .get('items')
        .then((val) => {
          if (val) {
            console.log('Los items son->', val);
            this.items = val;
            resolve(this.items);
          } else {
            // console.log('No habia recorridos se setean en vacío ->', val);
            this.items = [];
            this.storage.set('items', this.items).then(() => {
              resolve(this.getItems());
            });
          }
        })
        .catch(() => console.log('no se pudo acceder al storage :)'));
    });

    return promise;
  }
}
