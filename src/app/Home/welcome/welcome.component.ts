import { Component, OnInit } from '@angular/core';
import { ProductosService } from 'src/app/Servicios/productos.service';
import { FacturaService } from 'src/app/Servicios/factura.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { Producto } from 'src/app/Clases/producto';
import { Factura } from 'src/app/Clases/factura';
import { DetalleFactura } from 'src/app/Clases/detalle-factura';
import { DatePipe } from '@angular/common';
import { Transaction } from 'src/app/Interfaces/transaction';
import { BusinessService } from 'src/app/Servicios/business.service';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.css']
})
export class WelcomeComponent implements OnInit {

  public displayedColumns = ['insert', 'item', 'name', 'cost', 'cant', 'subtotal'];
  public transactions: Transaction[] = [
    { idpos: 0, insert: false, idItem: '', name: '', cant: 0, cost: 0 },];
  public dataSource = new BehaviorSubject([]);
  public chkAll: boolean = false;
  public persona: string;
  public rdFactura: string;
  public producto$: Observable<Producto>;
  public fecha: string;
  public codPersona: string;
  public codFactura: string;
  // public myFilter = (d: Date | null): boolean => {
  //   const day = (d || new Date()).getDay();
  //   // Prevent Saturday and Sunday from being selected.
  //   return day !== 0 && day !== 6;
  // }

  constructor(private businessService: BusinessService,
    private productosService: ProductosService,
    private facturaService: FacturaService,
    private datepipe: DatePipe) { }

  public ngOnInit() {
    this.dataSource.next(this.transactions);
  }

  public OnSubmit() {
    var errores = this.validaPosiciones();
    if (this.rdFactura != undefined) {
      if (!errores.length) {
        try {
          let hora = this.datepipe.transform(new Date(), 'HH:mm:ss');
          let fecha = this.datepipe.transform(new Date(this.fecha), 'yyyy-MM-dd');
          let factura = new Factura(this.codFactura, this.codPersona, fecha, hora, this.getTotalCost(), this.rdFactura);
          let detalle: DetalleFactura[] = [];
          for (let i = 0; i < this.transactions.length; i++) {
            const transac = this.transactions[i];
            detalle.push(new DetalleFactura(this.codFactura, i + 1, transac.cant, transac.cost, this.getSubtotal(transac), transac.idItem, this.codPersona));
          }
          if (factura.tipo == 'C') {
            this.facturaService.creaFacturaCompra(factura).subscribe(() => {
              this.facturaService.creaDetalleCompra(detalle).subscribe(() => {
                this.businessService.getAlert('Factura creada correctamente');
                this.reset();
              });
            });
          } else {
            this.facturaService.creaFacturaVenta(factura).subscribe(() => {
              this.facturaService.creaDetalleVenta(detalle).subscribe(() => {
                this.businessService.getAlert('Factura creada correctamente');
                this.reset();
              });
            });
          }
        } catch (error) {
          this.businessService.getAlert('Ingrese una fecha válida');
        }
      } else {
        var timeOut = 1500;
        errores.forEach((message, index) => {
          setTimeout(() => {
            this.businessService.getAlert(message);
          }, index * (timeOut + 200)); // 500 => timeout between two messages
        });
      }
    } else {
      this.businessService.getAlert('Ingrese tipo de factura');
    }
  }

  public btnClick() {
    try {
      var newID = this.transactions[this.transactions.length - 1].idpos + 1;
    } catch (error) {
      newID = 0;
    }
    var registro: Transaction = { idpos: newID, insert: false, idItem: '', cant: 0, cost: 0 };
    this.transactions.push(registro);
    this.dataSource.next(this.transactions);
  }

  public clear() {
    var array = [];
    this.transactions.forEach(transaction => {
      if (!transaction.insert) {
        array.push(transaction);
      }
    });
    this.transactions = array;
    this.dataSource.next(this.transactions);
    this.chkAll = false;
    this.businessService.getAlert('Posiciones seleccionadas eliminadas');
  }

  public reset() {
    this.transactions = [];
    this.dataSource.next(this.transactions);
    this.codFactura = null;
    this.codPersona = null;
    this.fecha = null;
  }

  public selectAll() {
    this.transactions.map(transac => transac.insert = this.chkAll);
    this.dataSource.next(this.transactions);
  }

  public find(datpos: Transaction) {
    var modificado: boolean;
    if (datpos.idItem) {
      this.producto$ = this.productosService.getProducto(datpos.idItem);
      this.producto$.forEach(producto => {
        for (let i = 0; i < this.transactions.length; i++) {
          const element = this.transactions[i];
          if (element.idpos == datpos.idpos && producto) {
            datpos.name = producto.nombre;
            datpos.disp = producto.stock;
            if (this.rdFactura == 'V') datpos.cost = producto.precioVenta;
            modificado = true;
            break;
          } else {
            datpos.name = '';
            if (this.rdFactura == 'V') datpos.cost = 0;
          }
        }
      });
      if (modificado) this.dataSource.next(this.transactions);
    }
  }

  public validaPosiciones() {
    var log = [];
    this.transactions.forEach(function (pos, index) {
      var msg = `Pos. ${index + 1} datos incompletos`;
      var error = false;
      if (!pos.name) { error = true }
      if (!pos.cant) { error = true }
      if (!pos.cost) { error = true }
      if (error) { log.push(msg) }
    });
    return log;
  }
  public getTipoPersona() {
    var valor: string;
    if (this.rdFactura == 'V') {
      valor = 'Cliente';
    } else {
      valor = 'Proveedor';
    }
    return valor;
  }
  public getSubtotal(t: Transaction): number {
    return t.cant * t.cost;
  }

  public getTotalCost(): number {
    var total: number;
    try {
      total = this.transactions.map(t => t.cost * t.cant).reduce((acc, value) => acc + value, 0);
    } catch (error) {
      total = 0;
    }
    return total;
  }
}
