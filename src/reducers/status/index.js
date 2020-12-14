import { handleActions, combineActions } from 'redux-actions'
import reduceReducers from 'reduce-reducers'

import {
    clearLocalAlert,
    clearGlobalAlert,
    setMainLoader
} from '../../actions/status'

const initialState = {
    mainLoader: false,
    actionStatus: {},
    globalAlert: {},
    localAlert: {}
}

const alertReducer = (state, { error, ready, payload, meta, type }) => {
    const actionStatus = {
        ...state.actionStatus,
        [type]: typeof ready === 'undefined'
            ? undefined
            : {
                success: typeof ready === 'undefined' 
                    ? typeof payload?.success === 'undefined' 
                        ? !error
                        : meta.alert.success
                    : (ready ? !error : undefined),
                pending: typeof ready === 'undefined' 
                    ? undefined 
                    : !ready,
                errorType: payload?.type,
                errorMessage: (error && payload?.toString()) || undefined,
                data: {
                    ...meta?.data,
                    ...payload
                } 
            }
    }

    return {
        ...state,
        actionStatus,
        mainLoader: typeof ready === 'undefined'
            ? state.mainLoader
            : Object.keys(actionStatus).reduce((x, action) => actionStatus[action]?.pending || x, false),
        globalAlert: {
            ...state.globalAlert,
            [type]: (meta?.alert?.showAlert || payload?.data?.showAlert)
                ? {
                    show: typeof ready === 'undefined'
                        ? true
                        : ready && ((meta?.alert?.onlyError && error) || (meta?.alert?.onlySuccess && !error)),
                    messageCodeHeader: meta?.alert?.messageCodeHeader || undefined,
                    messageCode: 
                        payload?.messageCode 
                        || (error
                            ? payload.type
                                ? `alert.${payload.type}`
                                : `alert.${type}.error`
                            : `alert.${type}.success`),
                    console: error && (meta.alert?.console || payload.data?.console)
                }
                : undefined
        },
        localAlert: typeof ready === 'undefined'
            ? state.localAlert
            : meta?.alert?.localAlert
                ? {
                    show: ready,
                    success: ready && !error,
                    messageCode: `alert.${type}.${
                        ready
                            ? error
                                ? 'error'
                                : 'success'
                            : 'pending'
                    }`
                }
                : undefined
    }
}

const clearReducer = handleActions({
    [clearLocalAlert]: state => Object.keys(state)
        .reduce((obj, key) => (
            key !== 'localAlert' 
                ? (obj[key] = state[key], obj) 
                : obj)
        , {}),
    [clearGlobalAlert]: (state, { payload }) => ({
        ...state,
        globalAlert: !payload 
            ? {} 
            : Object.keys(state.globalAlert).reduce((x, type) => ({
                ...x,
                ...(type !== payload
                    ? {
                        [type]: state.globalAlert[type]
                    }
                    : undefined)
            }), {})
    })
}, initialState)

const mainLoader = handleActions({
    [setMainLoader]: (state, { payload }) => ({
        ...state,
        mainLoader: payload
    })
}, initialState)

export default reduceReducers(
    initialState,
    alertReducer,
    clearReducer,
    mainLoader
)
