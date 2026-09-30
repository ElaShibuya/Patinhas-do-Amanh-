#ifndef UNICSUL_H
#define UNICSUL_H

#include <time.h>
#include <stdio.h>

void get_data_hora(char *dt, char *hr)
{
    time_t now;
    struct tm *local;

    now = time(NULL);
    local = localtime(&now);

    snprintf(
        dt,
        30,
        "%04d%02d%02d",
        local->tm_year + 1900,
        local->tm_mon + 1,
        local->tm_mday
    );

    snprintf(
        hr,
        30,
        "%02d%02d%02d",
        local->tm_hour,
        local->tm_min,
        local->tm_sec
    );
}

void get_prox_data(
    const char *data,
    int qty_days,
    char *prox_data
)
{
    int year, month, day;
    struct tm date = {0};

    sscanf(
        data,
        "%4d%2d%2d",
        &year,
        &month,
        &day
    );

    date.tm_year = year - 1900;
    date.tm_mon  = month - 1;
    date.tm_mday = day;

    mktime(&date);

    while (qty_days > 0)
    {
        date.tm_mday++;

        mktime(&date);

        if (date.tm_wday >= 1 && date.tm_wday <= 5)
        {
            qty_days--;
        }
    }

    snprintf(
        prox_data,
        30,
        "%04d%02d%02d",
        date.tm_year + 1900,
        date.tm_mon + 1,
        date.tm_mday
    );
}

int grava_log(
    const char *data_process,
    const char *processing_time,
    int code,
    float process_value,
    float mdr_value,
    float net_value,
    const char *data_credit
)
{
    char filename[100];
    FILE *file;


    snprintf(
        filename,
        sizeof(filename),
        "log/%s_%s_%06d.json",
        data_process,
        processing_time,
        code
    );

    printf("\n[%s]\n", filename);

    file = fopen(filename, "w");

    if (file == NULL)
    {
        return 1;
    }


    fprintf(
        file,
        "{\n"
        "    \"data_proc\": \"%s\",\n"
        "    \"hora_proc\": \"%s\",\n"
        "    \"cliente\": %06d,\n"
        "    \"valor_proc\": %.2f,\n"
        "    \"valor_mdr\": %.2f,\n"
        "    \"valor_credito\": %.2f,\n"
        "    \"data_credito\": \"%s\"\n"
        "}\n",

        data_process,
        processing_time,
        code,
        process_value,
        mdr_value,
        net_value,
        data_credit
    );


    fclose(file);

    return 0;
}

#endif