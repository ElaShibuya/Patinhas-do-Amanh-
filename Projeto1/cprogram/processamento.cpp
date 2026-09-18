#include <stdio.h>
#include <stdlib.h>
#include "unicsul.h"

int main(int argc, char *argv[])
{
    char dt_proc[30];
    char hr_proc[30];
    char prox_dt[30];

    int codigo;
    float valor, mdr_value, net_value;
    int metodo;

    if (argc != 4)
    {
        printf("Quantidade de argumentos invalida.\n");
        return 1;
    }

    codigo = atoi(argv[1]);
    valor = atof(argv[2]);
    metodo = atoi(argv[3]);

    get_data_hora(dt_proc, hr_proc);

    if (metodo == 0)
    {
        mdr_value = 0.0;
        net_value = valor;
        snprintf(prox_dt, sizeof(prox_dt), "%s", dt_proc);

        grava_log(
            dt_proc,
            hr_proc,
            codigo,
            valor,
            mdr_value,
            net_value,
            prox_dt
        );
    }
    else if (metodo == 1)
    {
        mdr_value = valor * 0.01;
        net_value = valor - mdr_value;
        get_prox_data(dt_proc, 1, prox_dt);

        grava_log(
            dt_proc,
            hr_proc,
            codigo,
            valor,
            mdr_value,
            net_value,
            prox_dt
        );
    }
    else if (metodo == 2)
    {
        mdr_value = valor * 0.05;
        net_value = valor - mdr_value;
        get_prox_data(dt_proc, 30, prox_dt);

        grava_log(
            dt_proc,
            hr_proc,
            codigo,
            valor,
            mdr_value,
            net_value,
            prox_dt
        );
    }
    else
    {
        printf("Metodo invalido.\n");
        return 1;
    }

    printf("Data do proc: %s\n", dt_proc);
    printf("Hora do proc: %s\n", hr_proc);
    printf("Proxima data util: %s\n", prox_dt);
    printf("Codigo: %06d\n", codigo);
    printf("Valor: %.2f\n", valor);
    printf("Metodo: %d\n", metodo);
    printf("MDR: %.2f\n", mdr_value);
    printf("Valor liquido: %.2f\n", net_value);
    printf("OBRIGADO PELA DOACAO\n");

    return 0;
}
