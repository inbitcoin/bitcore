#!/bin/bash

. ${UTILS_DIR}/common.sh

report_dir="${1}"
num_calls="${2}"
num_wlt="${3}"
wlt_name="wlt_${num_wlt}"
wlt_report="${report_dir}/${wlt_name}"

get_req_priv_key

amt="5000"
note="blablabla إلخ, إلخ бла-бла-бла"

get_req_priv_key

[ ! -z "${DISABLE_SYNC_WAIT}" ] || wait_to_start

i=1
if [ ! -f "${wlt_report}" ]; then
    echo "No report file found, skipping move" >> ${wlt_report}.err
    err="true"
else
    for i in $(seq 1 ${num_calls}); do
        url="/v4/addresses/"
        req_args='{"ignoreMaxGap": true}'
        http_method=${POST}
        call_bws
        [ "${err}" == "true" ] && break
        addr=$(jq -r '.address' ${OUTPUT_FILE})
        check_addr
        [ "${err}" == "true" ] && break

        url="/v1/utxos/"
        call_bws
        input=$(jq -r 'map(select(.locked==false)) | max_by(.satoshis)' ${OUTPUT_FILE})
        [ "${err}" == "true" ] && write_output && break
        echo "selected utxo: ${input}"

        echo "requesting txproposal..."
        url="/v3/txproposals/"
        req_args=$(echo \
            "{\"outputs\": [{\"toAddress\": \"${addr}\", \"amount\": ${amt}}]," \
            "\"feePerKb\": 10000, \"inputs\": [${input}]}"
        )
        http_method=${POST}
        call_bws
        [ "${err}" == "true" ] && write_output && break
        txp=$(cat ${OUTPUT_FILE})

        txp_id=$(jq -r '.id' <<< ${txp})
        url="/v2/txproposals/${txp_id}/publish/"
        http_method=${POST}
        proposal_sig=$(node ${UTILS_DIR}/signMessage.js "txp" "${txp}" "${req_priv_key}")
        req_args="{\"proposalSignature\": \"${proposal_sig}\"}"
        call_bws
        [ "${err}" == "true" ] && write_output && break

        key_data=$(jq -r '.key' ${WALLET_FILE})
        signatures=$(node ${UTILS_DIR}/signMessage.js "publishedTxp" "${txp}" "${key_data}")
        signatures=${signatures//\'/\"}
        url="/v1/txproposals/${txp_id}/signatures/"
        req_args="{\"signatures\": ${signatures}}"
        http_method=${POST}
        call_bws
        [ "${err}" == "true" ] && write_output && break

        url="/v1/txproposals/${txp_id}/broadcast"
        http_method=${POST}
        call_bws
        [ "${err}" == "true" ] && write_output && break
        txid=$(jq -r '.txid' ${OUTPUT_FILE})
        echo ${txid} >> ${wlt_report}
        echo "broadcasted txid: ${txid}"
        check_txid
        if [ "${err}" == "true" ]; then
            break
        else
            url="/v1/txnotes/${txid}/"
            http_method=${PUT}
            req_args="{\"txid\": \"${txid}\", \"body\": \"${note}\"}"
            call_bws
            write_output

            url="/v1/txnotes/${txid}/"
            call_bws
            write_output
        fi

        [ "${err}" != "true" ] && wait_block
    done
fi

if [ "${err}" == "true" ]; then
    # summing 1 since last round hasn't called wait_block
    let rounds_left=${num_calls}-${i}+1
    for i in $(seq 1 ${rounds_left}); do
        sleep 5
        wait_block
    done
    [ -f "${wlt_report}" ] && mv ${wlt_report}{,.err}
fi
